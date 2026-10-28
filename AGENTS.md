# Project Instructions

## Purpose

This project is a direct Google Apps Script web app for viewing and auditing the Software Requirements scoping breakdown (Unchanged / Regression, Modified, and New) for Ibex releases (such as Ibex v4.2, Ibex v4.2.1, and Ibex v4.2.2). It can be accessed directly or embedded inside Google Sites and Confluence via iframes.

## Project Structure

- `Code.gs` is the server-side Apps Script entry point, Jira Cloud API proxy, and scoping classification engine.
- `Index.html` is the client-side single-page dashboard served by `HtmlService`.
- `appsscript.json` is the Google Apps Script project manifest.
- `.clasp.json` configures the project connection to Google Apps Script.

## Scoping Classification Rules

The application classifies every Software Requirement in the release scope based on Jira labels:
- **Unchanged (Regression):** Carried forward without modification. Has `fixVersion = "Ibex v4.2.X"` without `-FF`, `ECO-v4.2`, or `-modified` labels.
- **Modified:** Pre-existing requirements from prior version that were cloned and updated. Has both `<version>-FF` (or `ECO-v4.2`) AND `<prior_version>-modified` labels (e.g. `v4.2.1-modified` and `FF-v4.2.2`, or `v4.1.2-modified` and `ECO-v4.2`).
- **New:** Brand new requirements created for this release. Has `<version>-FF` or `ECO-v4.2` (e.g. `FF-v4.2.2` or `ECO-v4.2`) without any `-modified` label.

## Security Requirements

- Keep Jira credentials only in Apps Script Script Properties: `JIRA_BASE_URL`, `JIRA_USER_EMAIL`, and `JIRA_API_TOKEN`.
- Never put tokens, passwords, API keys, or user credentials in source files, HTML, logs, or error messages.
- Preserve server-side Jira fetching through `UrlFetchApp`; do not expose Jira authentication to the client browser.
- Treat Jira requirement summaries, keys, and components as untrusted input. Escape values before inserting them into HTML.

## Development Rules

- Keep `doGet` compatible with Google Sites and Confluence iframe embedding by retaining `XFrameOptionsMode.ALLOWALL`.
- Preserve the public client-callable function `apiGetBreakdown(versionKey, forceRefresh)` when updating the UI or backend.
- Keep cache behavior explicit when changing data-fetching logic. The current cache TTL is one hour (3600 seconds).
- Use ES5-compatible JavaScript syntax in `Code.gs` and standard vanilla JavaScript in `Index.html`.

## Deployment Workflow

Source edits do not update the live web app automatically.
1. Push local changes to Apps Script using `npx @google/clasp push`.
2. Deploy a new version using `npx @google/clasp deploy --description "..."` or via the Apps Script Web Editor (**Deploy > Manage deployments > Edit active deployment > New version > Deploy**).
3. If the app is embedded in Google Sites or Confluence, refresh the host page after deployment.
