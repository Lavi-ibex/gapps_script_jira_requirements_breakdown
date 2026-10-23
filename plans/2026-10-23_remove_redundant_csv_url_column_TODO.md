# TODO - Remove Redundant URL Column from CSV Export

## Context
Remove the redundant `URL` column from the CSV export logic in `Index.html` so that the exported file contains exactly the 6 columns displayed on screen (Key, Summary, Category, Status, Component, Labels), with Key retaining the spreadsheet `=HYPERLINK(...)` formula. Push and redeploy to Google Apps Script via clasp, and commit and push to GitHub.

## Tasks

- [x] 1. Remove URL column from CSV export in Index.html
       Files: `/Users/lavi.landman/_Gits-Ibex/google_apps_script_jira_requirements_breakdown/Index.html`
       Done when: CSV `headers` array and row generation only include `['Key', 'Summary', 'Category', 'Status', 'Component', 'Labels']`.

- [x] 2. Push and redeploy via clasp
       Files: Apps Script live deployment
       Done when: `npx @google/clasp push` uploads code and deployment `AKfycbzkHwaXSgpyB67Fm5N13qtqdMq1XmiK3DJmOitQlA9NKGyzK0I6kodPr5sTVGxJfOAm` is redeployed with the updated version.

- [x] 3. Commit and push to GitHub
       Files: `Index.html`, `plans/2026-10-23_remove_redundant_csv_url_column_TODO.md`
       Done when: Changes are committed and pushed cleanly to `origin main`.

## Out of Scope
- Modifying `Code.gs` or Jira API queries.
- Changing column definitions in the UI table.
