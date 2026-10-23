# TODO - Rename Page Title and Add CSV Export Feature

## Context
Rename the page header title from "Ibex Requirements Scoping Breakdown" to "Ibex Requirements Breakdown" across `Index.html` and `Code.gs`. Add an "Export" button to the filter toolbar styled to match the dark/light UI palette. When clicked, it generates and downloads a CSV file containing the currently filtered requirements with the exact columns displayed on screen (Key, Summary, Category, Status, Component, Labels), updates Apps Script via clasp, and commits/pushes to GitHub.

## Tasks

- [x] 1. Rename page title in Index.html and Code.gs
       Files: `/Users/lavi.landman/_Gits-Ibex/google_apps_script_jira_requirements_breakdown/Index.html`, `/Users/lavi.landman/_Gits-Ibex/google_apps_script_jira_requirements_breakdown/Code.gs`
       Done when: Title in `<h1>`, `<title>`, and `doGet` is "Ibex Requirements Breakdown".

- [x] 2. Add Export button and CSV export logic in Index.html
       Files: `/Users/lavi.landman/_Gits-Ibex/google_apps_script_jira_requirements_breakdown/Index.html`
       Done when: Export button is styled and positioned next to category filters; clicking it downloads a properly formatted CSV of the currently active filtered requirements with columns Key (formatted as spreadsheet hyperlink formula), Summary, Category, Status, Component, Labels, and URL.

- [x] 3. Push and deploy via clasp
       Files: Apps Script live deployment
       Done when: Files are pushed with `npx @google/clasp push`, a new version is created, and the active deployment is redeployed.

- [x] 4. Commit and push to GitHub
       Files: `Index.html`, `Code.gs`, `plans/2026-10-23_export_csv_and_title_rename_TODO.md`
       Done when: Changes are committed with a clear message and pushed cleanly to `origin main`.

## Out of Scope
- Server-side CSV generation (client-side Blob download is instantaneous and respects live browser filter state without extra network latency).
- Changes to classification logic.
