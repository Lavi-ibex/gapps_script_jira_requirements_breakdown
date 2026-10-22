# Ibex Requirements Scoping Breakdown Web App

A lightweight, secure, responsive, and themeable Google Apps Script web app for viewing and auditing the Software Requirements breakdown for **Ibex v4.2.1** and **Ibex v4.2.2** across the three official QMS Feature Form scoping categories.

---

## 1. Scoping & Classification Logic

The application classifies every Software Requirement in the release scope based on the official guidelines established by Assaf Peled:

| Category | Description | Required Labels | How It Appears in Jira |
|:---------|:------------|:----------------|:-----------------------|
| **Unchanged (Regression)** | Requirements carried forward into the release without modification. | *None* | `fixVersion = "Ibex v4.2.X"` without `-FF` or `-modified` labels. |
| **Modified** | Pre-existing requirements from the prior version that were cloned and updated. | `<version>-FF` **AND** `<prior_version>-modified` | Has both labels (e.g. `v4.2.1-modified` and `FF-4.2.2`). |
| **New** | Brand new requirements created for this release. | **Only** `<version>-FF` | Has `<version>-FF` (e.g. `FF-4.2.2`) without any `-modified` label. |

---

## 2. Features & Architecture

- **Dual-Version View:** Seamlessly toggle between **Ibex v4.2.1** and **Ibex v4.2.2** with tab navigation.
- **High-Level Metric Cards:** Real-time counts and percentages for Total Requirements, Unchanged (Regression), Modified, and New.
- **Visual Distribution Bar:** Segmented, proportional bar depicting the composition of the release scope.
- **Interactive Search & Filtering:** Filter requirements by Category (All / Unchanged / Modified / New), Jira Component, or live text search across keys and summaries.
- **Direct Jira Links:** Clickable keys open the requirement directly in Jira in a new tab (`https://ibex-ai.atlassian.net/browse/KEY`).
- **Secure Backend Proxy:** Jira credentials (`JIRA_USER_EMAIL` and `JIRA_API_TOKEN`) reside exclusively inside Apps Script `Script Properties` - never exposed to clients.
- **Hourly Caching:** Google Apps Script `CacheService` caches results for 1 hour (3600s) for instant loading, with a **Refresh Live** button to bypass cache on demand.
- **Dark / Light Mode:** Built-in theme toggle with automatic OS preference detection and `localStorage` persistence.
- **Embed Ready:** Configured with `XFrameOptionsMode.ALLOWALL` for embedding into Google Sites or Confluence.

---

## 3. Deployment Instructions

### Step 1: Create the Google Apps Script Project
1. Navigate to [Google Apps Script](https://script.google.com/).
2. Click **+ New project**.
3. Rename the project to: `Ibex Requirements Scoping Breakdown`.

### Step 2: Copy Files
1. In the default `Code.gs` editor, replace all text with the contents of [Code.gs](Code.gs).
2. Click the **+** button next to Files and select **HTML**.
3. Name the file `Index` (Apps Script will create `Index.html`).
4. Replace all text in `Index.html` with the contents of [Index.html](Index.html).
5. Click **Save** (disk icon or `Cmd+S`).

### Step 3: Configure Jira Credentials
1. In the left navigation sidebar, click **Project Settings** (gear icon ⚙️).
2. Scroll to the **Script Properties** section and click **Edit script properties**.
3. Add the following three properties:
   - `JIRA_BASE_URL`: `https://ibex-ai.atlassian.net`
   - `JIRA_USER_EMAIL`: `your.email@ibex-ai.com`
   - `JIRA_API_TOKEN`: Your Atlassian API token (generate from [id.atlassian.com](https://id.atlassian.com/manage-profile/security/api-tokens)).
4. Click **Save script properties**.

### Step 4: Deploy the Web App
1. Click **Deploy** > **New deployment** (top right).
2. Under "Select type", click the gear icon ⚙️ and choose **Web app**.
3. Fill in the deployment details:
   - **Description:** `Initial release v1.0 - Requirements Scoping Breakdown`
   - **Execute as:** `Me (your.email@ibex-ai.com)`
   - **Who has access:** `Anyone within Ibex Medical Analytics` (or `Anyone`)
4. Click **Deploy**.
5. Copy the generated **Web App URL** (format: `https://script.google.com/a/macros/ibex-ai.com/s/.../exec`).

---

## 4. Embedding in Google Sites or Confluence

### Google Sites:
1. Open your Google Site editor.
2. In the right sidebar, click **Embed**.
3. Paste your Web App URL under **By URL** and click **Insert**.
4. Resize the embed container to full width.

### Confluence:
1. Edit your Confluence page.
2. Insert an **iframe** macro.
3. Set the iframe URL to your Web App URL.
4. Set width to `100%` and height to `800px`.
