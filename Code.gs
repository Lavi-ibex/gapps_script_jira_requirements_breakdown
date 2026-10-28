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

// Maps each release version to the baseline/previous release it is compared against.
// A requirement is only classified as "Modified" in the target release if it carries
// the specific modified label for that prior baseline (e.g. v4.2-modified for v4.2.1).
var PREVIOUS_VERSION_MAP = {
  'v4.2': '4.1.2',
  'v4.2.1': '4.2',
  'v4.2.2': '4.2.1'
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
      fields: ['key', 'summary', 'status', 'labels', 'components', 'priority', 'updated', 'fixVersions', 'issuelinks', 'description'],
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
  
  // Collect outward clone links to batch-fetch parent issues
  var cloneParentKeys = [];
  var cloneParentKeyMap = {}; // childKey -> parentKey
  for (var k = 0; k < issues.length; k++) {
    var itemLinks = (issues[k].fields && issues[k].fields.issuelinks) || [];
    for (var l = 0; l < itemLinks.length; l++) {
      var lnk = itemLinks[l];
      if (lnk.type && lnk.type.name === 'Cloners' && lnk.outwardIssue) {
        var pKey = lnk.outwardIssue.key;
        cloneParentKeyMap[issues[k].key] = pKey;
        if (cloneParentKeys.indexOf(pKey) === -1) {
          cloneParentKeys.push(pKey);
        }
        break;
      }
    }
  }

  // Batch-fetch parent issues if any
  var parentIssuesMap = {};
  if (cloneParentKeys.length > 0) {
    try {
      parentIssuesMap = batchFetchIssues(baseUrl, authHeader, cloneParentKeys);
    } catch (parentErr) {
      Logger.log('Warning fetching parent clone issues: ' + parentErr.toString());
    }
  }

  return processClassification(versionKey, fixVersionName, issues, baseUrl, cloneParentKeyMap, parentIssuesMap);
}

/**
 * Batch-fetches issue details (including description and fixVersions) by a list of keys.
 */
function batchFetchIssues(baseUrl, authHeader, keysList) {
  var map = {};
  if (!keysList || keysList.length === 0) return map;
  
  // Jira JQL supports up to 100 in an IN clause comfortably
  var chunkSize = 50;
  for (var i = 0; i < keysList.length; i += chunkSize) {
    var chunk = keysList.slice(i, i + chunkSize);
    var jql = 'issueKey in (' + chunk.join(',') + ')';
    var payload = {
      jql: jql,
      fields: ['key', 'summary', 'status', 'fixVersions', 'description'],
      maxResults: 100
    };
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
    var response = UrlFetchApp.fetch(baseUrl + '/rest/api/3/search/jql', options);
    if (response.getResponseCode() === 200) {
      var data = JSON.parse(response.getContentText());
      var issues = data.issues || [];
      for (var j = 0; j < issues.length; j++) {
        map[issues[j].key] = issues[j];
      }
    }
  }
  return map;
}

/**
 * Recursively extracts plain text from ADF (Atlassian Document Format) or raw strings.
 */
function extractPlainText(node) {
  if (!node) return '';
  if (typeof node === 'string') return node.trim();
  if (Array.isArray(node)) {
    var parts = [];
    for (var i = 0; i < node.length; i++) {
      var t = extractPlainText(node[i]);
      if (t) parts.push(t);
    }
    return parts.join(' ').trim();
  }
  if (typeof node === 'object') {
    var res = '';
    if (node.text) res += node.text;
    if (node.content) {
      var sub = extractPlainText(node.content);
      if (sub) res += (res ? ' ' : '') + sub;
    }
    return res.trim();
  }
  return '';
}

/**
 * Classifies an array of Jira requirement issues into Unchanged, Modified, and New buckets.
 * Also checks for requirements that were cloned into this version without description updates.
 */
function processClassification(versionKey, fixVersionName, rawIssues, baseUrl, cloneParentKeyMap, parentIssuesMap) {
  cloneParentKeyMap = cloneParentKeyMap || {};
  parentIssuesMap = parentIssuesMap || {};
  var cleanNum = versionKey.replace(/^[^\d]*/, ''); // "4.2", "4.2.1", or "4.2.2"
  var escapedNum = cleanNum.replace(/\./g, '\\.');
  
  // Scoping label identification patterns:
  // e.g. "FF-4.2", "FF-v4.2", "ECO-v4.2", "v4.2-FF", "v4.2-ECO", "FF-4.2.1", "FF-v4.2.1", "v4.2.1-FF", "v4.2.2-FF", "FF-4.2.2", "FF-v4.2.2"
  var ffPattern = new RegExp('^(?:(?:FF|ECO)-v?|v?)' + escapedNum + '-?(?:FF|ECO)?$', 'i');
  
  // A requirement is ONLY considered modified relative to this release if it carries
  // the modification label targeting the previous baseline release (e.g. "v4.2-modified" for v4.2.1).
  // Older labels like "v3.6-modified" or "v4.1.2-modified" are historical and must be treated as unchanged/carried forward.
  var prevVerNum = PREVIOUS_VERSION_MAP[versionKey] || '';
  var prevEscaped = prevVerNum.replace(/\./g, '\\.');
  var targetModPattern = prevEscaped
    ? new RegExp('^(?:v?)' + prevEscaped + '-modified$', 'i')
    : /^modified$/i;
  
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
      if (targetModPattern.test(lbl)) {
        hasMod = true;
      }
    }
    
    var fixVersions = [];
    if (fields.fixVersions && fields.fixVersions.length > 0) {
      for (var fv = 0; fv < fields.fixVersions.length; fv++) {
        fixVersions.push(fields.fixVersions[fv].name);
      }
    }

    var item = {
      key: key,
      summary: summary,
      status: status,
      priority: priority,
      labels: labels,
      components: components,
      fixVersions: fixVersions,
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

  // Detect requirements cloned from a prior version whose description is identical
  var identicalClones = [];
  for (var idx = 0; idx < rawIssues.length; idx++) {
    var child = rawIssues[idx];
    var childKey = child.key;
    var parentKey = cloneParentKeyMap[childKey];
    if (parentKey && parentIssuesMap[parentKey]) {
      var parent = parentIssuesMap[parentKey];
      var childFields = child.fields || {};
      var parentFields = parent.fields || {};

      var childText = extractPlainText(childFields.description);
      var parentText = extractPlainText(parentFields.description);

      var childJson = JSON.stringify(childFields.description || {});
      var parentJson = JSON.stringify(parentFields.description || {});

      var isIdentical = (childJson === parentJson) || (childText.length > 0 && childText === parentText);
      if (isIdentical) {
        var childFVs = [];
        if (childFields.fixVersions) {
          for (var v1 = 0; v1 < childFields.fixVersions.length; v1++) {
            childFVs.push(childFields.fixVersions[v1].name);
          }
        }
        var parentFVs = [];
        if (parentFields.fixVersions) {
          for (var v2 = 0; v2 < parentFields.fixVersions.length; v2++) {
            parentFVs.push(parentFields.fixVersions[v2].name);
          }
        }

        identicalClones.push({
          key: childKey,
          summary: childFields.summary || '',
          status: (childFields.status && childFields.status.name) ? childFields.status.name : 'Unknown',
          fixVersions: childFVs,
          url: baseUrl + '/browse/' + childKey,
          clonedFromKey: parentKey,
          clonedFromSummary: parentFields.summary || '',
          clonedFromFixVersions: parentFVs,
          clonedFromUrl: baseUrl + '/browse/' + parentKey
        });
      }
    }
  }

  return {
    versionKey: versionKey,
    versionName: fixVersionName,
    total: total,
    counts: counts,
    percentages: percentages,
    unchanged: unchanged,
    modified: modified,
    new: newReqs,
    warnings: {
      identicalClones: identicalClones,
      identicalClonesCount: identicalClones.length
    },
    components: sortedComponents,
    fetchedAt: new Date().toISOString()
  };
}
