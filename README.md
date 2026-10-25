# Ibex Requirements Breakdown Web App

A lightweight, secure, responsive, and themeable Google Apps Script web app for viewing and auditing the Software Requirements breakdown for **Ibex v4.2**, **Ibex v4.2.1**, and **Ibex v4.2.2** across the three official QMS Feature Form scoping categories.

- **Google Sites Portal:** [Ibex PPM Delivery Hub](https://sites.google.com/ibex-ai.com/ibex-ppm-delivery-hub/requirements-breakdown)
- **Live Web App:** [Open Web App](https://script.google.com/a/macros/ibex-ai.com/s/AKfycbzkHwaXSgpyB67Fm5N13qtqdMq1XmiK3DJmOitQlA9NKGyzK0I6kodPr5sTVGxJfOAm/exec)
- **GitHub Repository:** https://github.com/Lavi-ibex/gapps_script_jira_requirements_breakdown
- **Google Apps Script IDE:** [Project Editor](https://script.google.com/d/1vFGXStpY9QjeGs3QO-GdxAiNpLEq-bKeuYOey58ABubE0e03Yah0KeQa/edit)
- **Script ID:** `1vFGXStpY9QjeGs3QO-GdxAiNpLEq-bKeuYOey58ABubE0e03Yah0KeQa`

---

## 1. Scoping & Classification Logic

The application classifies every Software Requirement in the release scope based on the official guidelines established by Assaf Peled:

| Category | Description | Required Labels | How It Appears in Jira |
|:---------|:------------|:----------------|:-----------------------|
| **Unchanged (Regression)** | Requirements carried forward into the release without modification. | *None* | `fixVersion = "Ibex v4.2.X"` without `-FF` or `-modified` labels. |
| **Modified** | Pre-existing requirements from the prior version that were cloned and updated. | `<version>-FF` (or `ECO-v4.2`) **AND** `<prior_version>-modified` | Has both labels (e.g. `v4.2.1-modified` and `FF-4.2.2`, or `v4.1.2-modified` and `ECO-v4.2`). |
| **New** | Brand new requirements created for this release. | **Only** `<version>-FF` or `ECO-v4.2` | Has `<version>-FF` (e.g. `FF-4.2.2` or `ECO-v4.2`) without any `-modified` label. |

---

## 2. Features & Architecture

- **Multi-Version View:** Seamlessly toggle between **Ibex v4.2**, **Ibex v4.2.1**, and **Ibex v4.2.2** with tab navigation.
- **High-Level Metric Cards:** Real-time counts and percentages for Total Requirements, Unchanged (Regression), Modified, and New.
- **Visual Distribution Bar:** Segmented, proportional bar depicting the composition of the release scope.
- **Interactive Search & Filtering:** Filter requirements by Category (All / Unchanged / Modified / New), Jira Component, or live text search across keys and summaries.
- **Direct Jira Links:** Clickable keys open the requirement directly in Jira in a new tab (`https://ibex-ai.atlassian.net/browse/KEY`).
- **Secure Backend Proxy:** Jira credentials (`JIRA_USER_EMAIL` and `JIRA_API_TOKEN`) reside exclusively inside Apps Script `Script Properties` - never exposed to clients.
- **Hourly Caching:** Google Apps Script `CacheService` caches results for 1 hour (3600s) for instant loading, with a **Refresh Live** button to bypass cache on demand.
- **Dark / Light Mode:** Built-in theme toggle with automatic OS preference detection and `localStorage` persistence.
- **Embed Ready:** Configured with `XFrameOptionsMode.ALLOWALL` for embedding into Google Sites or Confluence.

---

## 3. Development & Deployment Workflow (clasp)

This repository is connected directly to Google Apps Script via `.clasp.json`.

### Syncing Code with Clasp
- **Push local changes to Google Apps Script:**
  ```bash
  npx @google/clasp push
  ```
- **Pull remote changes from Google Apps Script:**
  ```bash
  npx @google/clasp pull
  ```

### Script Properties Setup (One-Time Setup)
1. In the Apps Script project editor, click **Project Settings** (gear icon ⚙️).
2. Under **Script Properties**, ensure the following properties are configured:
   - `JIRA_BASE_URL`: `https://ibex-ai.atlassian.net`
   - `JIRA_USER_EMAIL`: `your.email@ibex-ai.com`
   - `JIRA_API_TOKEN`: Your Atlassian API token (generated from [id.atlassian.com](https://id.atlassian.com/manage-profile/security/api-tokens))

### Deploying a New Version
When updates to `Code.gs` or `Index.html` are pushed, update the active Web App deployment:

- **Via clasp CLI:**
  ```bash
  npx @google/clasp deploy --description "Description of updates"
  ```
- **Via Apps Script Web Editor:**
  1. Open the [Project Editor](https://script.google.com/d/1vFGXStpY9QjeGs3QO-GdxAiNpLEq-bKeuYOey58ABubE0e03Yah0KeQa/edit).
  2. Click **Deploy > Manage deployments** (top right).
  3. Select the active Web App deployment from the list on the left.
  4. Click the **Pencil (Edit)** icon at the top right of the modal.
  5. Under **Version**, choose **New version**.
  6. Click **Deploy**.

*(Note: The deployment URL remains constant across version updates.)*

---

## 4. Embedding in Google Sites or Confluence

### Google Sites:
1. Open your Google Site editor.
2. In the right sidebar, click **Embed**.
3. Paste the Web App URL under **By URL** and click **Insert**.
4. Resize the embed container to full width.

### Confluence:
1. Edit your Confluence page.
2. Insert an **iframe** macro.
3. Set the iframe URL to the Web App URL.
4. Set width to `100%` and height to `800px`.
