# TODO - Add Project Governance Files (AGENTS.md, Symlinks, .gitignore)

## Context
Add missing project governance and configuration files to `google_apps_script_jira_requirements_breakdown` to ensure complete consistency with companion Apps Script repositories. This includes adding `.gitignore` to prevent secret/artifact leakage, creating a project-specific `AGENTS.md` covering scoping rules, security, clasp commands, and embedding, creating agent symlinks (`CLAUDE.md`, `GEMINI.md`), and committing and pushing to GitHub.

## Tasks

- [x] 1. Create .gitignore
       Files: `/Users/lavi.landman/_Gits-Ibex/google_apps_script_jira_requirements_breakdown/.gitignore`
       Done when: File exists and ignores secrets (`.env*`, `*.token`, `*.key`), editor files (`.DS_Store`, `.vscode/`, `.idea/`), and python caches if any.

- [x] 2. Create project-tailored AGENTS.md
       Files: `/Users/lavi.landman/_Gits-Ibex/google_apps_script_jira_requirements_breakdown/AGENTS.md`
       Done when: File specifies requirements breakdown scoping rules, project structure, security rules, clasp deployment instructions, and embedding constraints.

- [x] 3. Create agent symlinks CLAUDE.md and GEMINI.md
       Files: `CLAUDE.md -> AGENTS.md`, `GEMINI.md -> AGENTS.md`
       Done when: Symlinks exist and correctly resolve to `AGENTS.md`.

- [x] 4. Commit and push to GitHub
       Files: `.gitignore`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`
       Done when: Changes are committed and pushed cleanly to `https://github.com/Lavi-ibex/google_apps_script_jira_requirements_breakdown` on `main`.

## Out of Scope
- Modifying `Code.gs`, `Index.html`, or `README.md`.
- Modifying existing deployment configurations.
