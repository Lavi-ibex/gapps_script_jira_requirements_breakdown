# TODO - Publish google_apps_script_jira_requirements_breakdown to GitHub

## Context
Create a public remote GitHub repository under the `Lavi-ibex` organization named `google_apps_script_jira_requirements_breakdown`, link it as the `origin` remote for this project, push the `main` branch, rename the local directory to match, and ensure the companion repository `google_apps_script_jira_releases` also has its `origin` remote configured.

## Tasks

- [x] 1. Create public GitHub repository and push code
       Files: Local git repository (`.git/config`)
       Done when: Public repo `Lavi-ibex/google_apps_script_jira_requirements_breakdown` is created on GitHub, `origin` remote is added, and the `main` branch is successfully pushed.

- [x] 2. Rename local project directory
       Files: `/Users/lavi.landman/_Gits-Ibex/google_apps_script_requirements_breakdown` -> `/Users/lavi.landman/_Gits-Ibex/google_apps_script_jira_requirements_breakdown`
       Done when: Directory is renamed to `google_apps_script_jira_requirements_breakdown` and git status verifies clean working tree.

- [x] 3. Configure git remote for companion repo
       Files: `/Users/lavi.landman/_Gits-Ibex/google_apps_script_jira_releases/.git/config`
       Done when: `git -C /Users/lavi.landman/_Gits-Ibex/google_apps_script_jira_releases remote -v` shows `origin` pointing to `https://github.com/Lavi-ibex/google_apps_script_jira_releases.git`.

- [x] 4. Verification and link check
       Files: None
       Done when: `gh repo view` and `git remote -v` return successful status and URLs for both repositories.

## Out of Scope
- Modifying project source code (`Code.gs`, `Index.html`, `.clasp.json`).
- Modifying clasp deployment configurations.
