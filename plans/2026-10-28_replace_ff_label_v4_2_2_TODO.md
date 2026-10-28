# TODO - Replace FF-4.2.2 with FF-v4.2.2 on Jira Requirements and Update Documentation

## Context
In release Ibex v4.2.2, scoping labels for feature form requirements must use the canonical prefix `FF-v4.2.2`. Currently, three Jira requirement tickets carry the label `FF-4.2.2` ([IBX-17642](https://ibex-ai.atlassian.net/browse/IBX-17642), [IBX-20106](https://ibex-ai.atlassian.net/browse/IBX-20106), and [IBX-17550](https://ibex-ai.atlassian.net/browse/IBX-17550)). This task updates the live Jira labels across all three tickets via the Jira REST API, verifies the updated labels, and updates the scoping label examples in the `gapps_script_jira_requirements_breakdown` documentation to reference `FF-v4.2.2`.

## Tasks

- [x] 1. Update Jira labels on [IBX-17642](https://ibex-ai.atlassian.net/browse/IBX-17642), [IBX-20106](https://ibex-ai.atlassian.net/browse/IBX-20106), and [IBX-17550](https://ibex-ai.atlassian.net/browse/IBX-17550) to replace `FF-4.2.2` with `FF-v4.2.2`.
       Files: Live Jira REST API (`/rest/api/3/issue/{key}`)
       Done when: JQL search `labels = "FF-4.2.2"` returns 0 issues, and all three tickets ([IBX-17642](https://ibex-ai.atlassian.net/browse/IBX-17642), [IBX-20106](https://ibex-ai.atlassian.net/browse/IBX-20106), [IBX-17550](https://ibex-ai.atlassian.net/browse/IBX-17550)) have `FF-v4.2.2` in their live labels list.

- [x] 2. Update scoping label examples in `README.md` and `AGENTS.md` of `gapps_script_jira_requirements_breakdown`.
       Files: `gapps_script_jira_requirements_breakdown/README.md`, `gapps_script_jira_requirements_breakdown/AGENTS.md`
       Done when: Documentation examples reference `FF-v4.2.2` instead of `FF-4.2.2` for release v4.2.2 scoping.

- [x] 3. Verify git diff and request explicit user confirmation for any git commit/push.
       Files: `gapps_script_jira_requirements_breakdown/README.md`, `gapps_script_jira_requirements_breakdown/AGENTS.md`
       Done when: `git diff` shows only the intended documentation updates, and no commit or push is made without explicit user permission.

## Out of Scope
- Modifying Jira tickets other than [IBX-17642](https://ibex-ai.atlassian.net/browse/IBX-17642), [IBX-20106](https://ibex-ai.atlassian.net/browse/IBX-20106), and [IBX-17550](https://ibex-ai.atlassian.net/browse/IBX-17550).
- Altering other labels or fields (e.g. `v4.2.1-modified`, `fixVersions`, descriptions).
- Modifying `Code.gs` or `Index.html` logic (the backend regex already matches both `FF-v4.2.2` and `FF-4.2.2`).
