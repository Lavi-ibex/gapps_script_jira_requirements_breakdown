# TODO - Add Ibex v4.2 Tab with ECO Scoping Support

## Context
Add a new leftmost navigation tab for release "Ibex v4.2" (Jira version 10024) to the Requirements Scoping Breakdown dashboard while keeping "Ibex v4.2.1" as the initial default selected tab. Update the backend classification logic in `Code.gs` to recognize `ECO-v4.2` scoping labels alongside `FF-<version>`, update `Index.html`, push and deploy the new version via `clasp`, and commit and push all changes to GitHub.

## Tasks

- [x] 1. Update backend classification in Code.gs
       Files: `/Users/lavi.landman/_Gits-Ibex/google_apps_script_jira_requirements_breakdown/Code.gs`
       Done when: `SUPPORTED_VERSIONS` includes `'v4.2': 'Ibex v4.2'`, `doGet` title references v4.2, and `processClassification` properly detects `ECO-v4.2` (and `ECO-` scoping prefixes) for New vs Modified vs Unchanged categorization.

- [x] 2. Add leftmost tab in Index.html
       Files: `/Users/lavi.landman/_Gits-Ibex/google_apps_script_jira_requirements_breakdown/Index.html`
       Done when: `<button class="nav-tab" data-version="v4.2">Ibex v4.2</button>` is rendered as the first (leftmost) button in `version-nav`, `v4.2.1` remains active by default, and simulated fallback data includes `v4.2`.

- [x] 3. Update README.md and AGENTS.md documentation
       Files: `README.md`, `AGENTS.md`
       Done when: Both files document `Ibex v4.2` and the `ECO-v4.2` scoping label rules.

- [x] 4. Push and deploy via clasp
       Files: Apps Script deployment
       Done when: `npx @google/clasp push` uploads code to Google Apps Script and `npx @google/clasp deploy` deploys a new version to the live web app.

- [x] 5. Commit and push to GitHub
       Files: `Code.gs`, `Index.html`, `README.md`, `AGENTS.md`, `plans/2026-10-23_add_v4_2_tab_TODO.md`
       Done when: Git commit is created and pushed cleanly to `origin main`.

## Out of Scope
- Changing Jira issue labels or modifying Jira tickets.
- Altering existing styling or themes.
