/**
 * Google Apps Script Backend for Ibex Requirements Scoping Breakdown Widget.
 * Fetches Software Requirements from Jira Cloud REST API v3,
 * categorizes them into Unchanged, Modified, and New buckets according to
 * official QMS Feature Form scoping rules, caches results for 1 hour,
 * and serves an interactive responsive dashboard.
 */

// Configuration constants
var CACHE_EXPIRATION_SECONDS = 3600; // 1 hour
var CACHE_PREFIX = 'IBEX_REQ_BREAKDOWN_';
var AUTHORIZED_EMAIL_DOMAIN = 'ibex-ai.com';

var SUPPORTED_VERSIONS = {
  'v4.2': 'Ibex v4.2',
  'v4.2.1': 'Ibex v4.2.1',
  'v4.2.2': 'Ibex v4.2.2'
};

/**
 * HTTP GET entry point for Google Apps Script Web App.
 * Serves Index.html with permissions for standalone and iframe embedding.
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Ibex Requirements Breakdown (v4.2, v4.2.1 & v4.2.2)')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Public client-callable API to fetch requirements breakdown.
 * @param {string} versionKey - 'v4.2.1', 'v4.2.2', or 'all'.
 * @param {boolean} forceRefresh - If true, bypasses cache and queries Jira directly.
 * @returns {Object} Requirements breakdown payload.
 */
function apiGetBreakdown(versionKey, forceRefresh) {
  var target = versionKey || 'all';
  
  if (target === 'all') {
    var result = {};
    for (var key in SUPPORTED_VERSIONS) {
      result[key] = getBreakdownForVersion(key, SUPPORTED_VERSIONS[key], !!forceRefresh);
    }
    return result;
  }
  
  if (!SUPPORTED_VERSIONS[target]) {
    throw new Error('Unsupported version key: ' + target + '. Must be "v4.2", "v4.2.1", "v4.2.2", or "all".');
  }
  
  return getBreakdownForVersion(target, SUPPORTED_VERSIONS[target], !!forceRefresh);
}

/**
 * Retrieves breakdown for a specific version from CacheService or live Jira API.
 */
function getBreakdownForVersion(key, fixVersionName, forceRefresh) {
  var cacheKey = CACHE_PREFIX + key;
  var cache = CacheService.getScriptCache();
  
  if (!forceRefresh) {
    var cached = cache.get(cacheKey);
    if (cached) {
      try {
        var parsed = JSON.parse(cached);
        parsed.fromCache = true;
        return parsed;
      } catch (err) {
        // If cache parsing fails, continue to fresh fetch
      }
    }
  }
  
  var freshData = fetchAndClassifyFromJira(key, fixVersionName);
  freshData.fromCache = false;
  
  try {
    cache.put(cacheKey, JSON.stringify(freshData), CACHE_EXPIRATION_SECONDS);
  } catch (err) {
    Logger.log('Cache put warning (payload size): ' + err.toString());
  }
  
  return freshData;
}

/**
 * Queries Jira Cloud POST /rest/api/3/search/jql with pagination,
 * and categorizes requirements according to the 3-state Feature Form rules.
 */
function fetchAndClassifyFromJira(versionKey, fixVersionName) {
  var scriptProps = PropertiesService.getScriptProperties();
  var baseUrl = (scriptProps.getProperty('JIRA_BASE_URL') || 'https://ibex-ai.atlassian.net').replace(/\/+$/, '');
  var userEmail = scriptProps.getProperty('JIRA_USER_EMAIL');
  var apiToken = scriptProps.getProperty('JIRA_API_TOKEN');
  
  if (!userEmail || !apiToken) {
    throw new Error('Jira credentials (JIRA_USER_EMAIL and JIRA_API_TOKEN) are not configured in Script Properties.');
  }
  
  var authHeader = 'Basic ' + Utilities.base64Encode(userEmail + ':' + apiToken);
  var jql = 'project = IBX AND issuetype = Requirement AND fixVersion = "' + fixVersionName + '" ORDER BY Rank ASC';
  var endpoint = baseUrl + '/rest/api/3/search/jql';
  
  var issues = [];
  var nextPageToken = null;
  var maxResults = 100;
  var maxPages = 15;
  var pageCount = 0;
  
  while (pageCount < maxPages) {
    pageCount++;
    var payload = {
      jql: jql,
      fields: ['key', 'summary', 'status', 'labels', 'components', 'priority', 'updated'],
      maxResults: maxResults
    };
    if (nextPageToken) {
      payload.nextPageToken = nextPageToken;
    }
    
    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(endpoint, options);
    var statusCode = response.getResponseCode();
    
    if (statusCode !== 200) {
      throw new Error('Jira API request failed (HTTP ' + statusCode + '): ' + response.getContentText());
    }
    
    var data = JSON.parse(response.getContentText());
    var batch = data.issues || [];
    issues = issues.concat(batch);
    
    if (data.isLast || !data.nextPageToken || batch.length === 0) {
      break;
    }
    nextPageToken = data.nextPageToken;
  }
  
  return processClassification(versionKey, fixVersionName, issues, baseUrl);
}

/**
 * Classifies an array of Jira requirement issues into Unchanged, Modified, and New buckets.
 */
function processClassification(versionKey, fixVersionName, rawIssues, baseUrl) {
  var cleanNum = versionKey.replace(/^[^\d]*/, ''); // "4.2", "4.2.1", or "4.2.2"
  var escapedNum = cleanNum.replace(/\./g, '\\.');
  
  // Scoping label identification patterns:
  // e.g. "FF-4.2", "FF-v4.2", "ECO-v4.2", "v4.2-FF", "v4.2-ECO", "FF-4.2.1", "FF-v4.2.1", "v4.2.1-FF", "v4.2.2-FF", "FF-4.2.2"
  var ffPattern = new RegExp('^(?:(?:FF|ECO)-v?|v?)' + escapedNum + '-?(?:FF|ECO)?$', 'i');
  var modPattern = /modified/i;
  
  var unchanged = [];
  var modified = [];
  var newReqs = [];
  var componentsSet = {};
  
  for (var i = 0; i < rawIssues.length; i++) {
    var iss = rawIssues[i];
    var key = iss.key;
    var fields = iss.fields || {};
    var summary = fields.summary || '';
    var status = (fields.status && fields.status.name) ? fields.status.name : 'Unknown';
    var labels = fields.labels || [];
    var priority = (fields.priority && fields.priority.name) ? fields.priority.name : '';
    var updated = fields.updated || '';
    
    var components = [];
    if (fields.components && fields.components.length > 0) {
      for (var c = 0; c < fields.components.length; c++) {
        var cName = fields.components[c].name;
        components.push(cName);
        componentsSet[cName] = true;
      }
    }
    
    var hasFF = false;
    var hasMod = false;
    
    for (var l = 0; l < labels.length; l++) {
      var lbl = labels[l];
      var lower = lbl.toLowerCase();
      if (
        ffPattern.test(lbl) ||
        lower.indexOf('ff-' + cleanNum) !== -1 ||
        lower.indexOf(cleanNum + '-ff') !== -1 ||
        lower.indexOf('eco-' + cleanNum) !== -1 ||
        lower.indexOf('eco-v' + cleanNum) !== -1
      ) {
        hasFF = true;
      }
      if (modPattern.test(lbl)) {
        hasMod = true;
      }
    }
    
    var item = {
      key: key,
      summary: summary,
      status: status,
      priority: priority,
      labels: labels,
      components: components,
      updated: updated,
      url: baseUrl + '/browse/' + key
    };
    
    if (hasFF && hasMod) {
      modified.push(item);
    } else if (hasFF && !hasMod) {
      newReqs.push(item);
    } else if (!hasFF && hasMod) {
      // Cloned / modified requirement with modified label
      modified.push(item);
    } else {
      // Unchanged requirement carried forward without scoping label
      unchanged.push(item);
    }
  }
  
  var total = rawIssues.length;
  var counts = {
    unchanged: unchanged.length,
    modified: modified.length,
    new: newReqs.length
  };
  
  var percentages = {
    unchanged: total > 0 ? Math.round((counts.unchanged / total) * 1000) / 10 : 0,
    modified: total > 0 ? Math.round((counts.modified / total) * 1000) / 10 : 0,
    new: total > 0 ? Math.round((counts.new / total) * 1000) / 10 : 0
  };
  
  var sortedComponents = Object.keys(componentsSet).sort();
  
  return {
    versionKey: versionKey,
    versionName: fixVersionName,
    total: total,
    counts: counts,
    percentages: percentages,
    unchanged: unchanged,
    modified: modified,
    new: newReqs,
    components: sortedComponents,
    fetchedAt: new Date().toISOString()
  };
}
