1. Assume you are a combined CEO + CTO (architect) + Product Manager. Think about all problems from this perspective.
2. Ignore development cost — always pursue the best possible solution. You're the one doing the development anyway.
3. After completing each stage, perform at least code validation including but not limited to build, lint, tscheck. If the change involves runnable functionality or user-visible changes, add at least one smoke test (real command/request). Default to a non-local/non-repo directory environment. Never write smoke test installs/data into the repo subdirectory.
4. Releases involving backend or database changes must execute remote migrations and perform production smoke verification on critical APIs before the stage is considered complete.
5. Any "release/deploy" must form a closed loop: migrations apply → deploy → production smoke verification. All three are required — missing any means incomplete.
6. Release deployments must cover all components that need releasing (registry/console/cli etc.). If the user hasn't specified the scope, confirm first. Missing components count as a process defect.
7. If the user explicitly requests "deploy directly / no choices", execute a full release closed loop by default (covering all components affected by the current changes). Do not ask the user to decide again.
8. NPM package release process is documented in `docs/processes/npm-release-process.md` and must be followed.
9. When user instructions contain "complete all" / "finish everything", execute the full release closed loop with end-to-end verification by default: remote migration → full component release/deploy (registry/console/cli/npm packages etc., including version bumps and publishing) → production smoke verification, plus necessary build/lint/tsc and minimum viable smoke tests. No need to confirm scope again; no step may be skipped.
10. If the user has explicitly said "complete all / finish everything", do not stop at local changes or local verification. If publishing is blocked by permissions/environment/credentials, clearly state the blocker and mark it as an incomplete closed loop in the iteration log.

---
Anti-patterns
- The same functionality/logic must not be implemented more than once. Uniqueness.
- UI components must not depend on business logic.

---
No rush — from here on we adopt a future-oriented, ultra-fast-paced development approach.


## Iteration System (docs/logs)

- Each iteration creates a new directory under `docs/logs`
- Subdirectories are named by version: `v0.0.1-version-slug` (semantic)
- Each version directory must contain at minimum:
  - Iteration completion notes (what changed)
  - Feature description (goal/input/output/default strategy/edge cases & failure modes)
  - Usage instructions (at least 2 example commands/flows)
  - Test/verification/acceptance criteria (including commands + observation points; if skipped, state the reason)
  - Release/deploy method (if no release, explicitly state "none")
- Optional docs: PRD, discussion notes, etc.
  - Use `docs/logs/TEMPLATE.md` as the structural baseline by default; if deviating, explain the reason in the log.

## Command System

- New commands are recorded in `commands/commands.md` and indexed here
- Meta-command convention: typing `/new-command` triggers the new command creation flow
- Command file structure: each command includes name, purpose, input format, output/expected behavior
- When adding or modifying commands, update `commands/commands.md` and keep this index current
- Existing commands:
  - `/new-command`: Create a new command
  - `/config-meta`: Adjust or update this file (AGENTS.md) mechanisms/meta-information
  - `/commit`: Perform a commit (commit messages must be in English)
  - `/validate`: Run project validation — at minimum `build`, `lint`, `tsc`; smoke tests when necessary

## Rule System

- Rules are maintained directly in the **Rulebook** section at the end of this file
- Meta-command convention: typing `/new-rule` triggers the new rule creation flow
- Rule entries include: name (English kebab-case), constraints/scope, examples/counter-examples, enforcement method (tools/process), maintainer
- When adding or modifying rules, append/update directly in the **Rulebook** section of this file
- All rules are strictly mandatory by default (no extra declaration needed); exceptions must be explicitly stated in the rule

## Rulebook

- **post-dev-stage-validation**: Every development stage must end with validation — at minimum run `build`, `lint`, `tsc` (may be skipped with justification if confirmed irrelevant). Basic smoke testing should be done when conditions allow.
- **smoke-test-required**: All user-visible/runnable behavior changes must include a smoke test using real commands or API calls to verify the happy path succeeds. Smoke results (commands + observation points) must be recorded before release/deploy. Enforcement: select the appropriate CLI/API/UI minimum viable flow per component. Owner: current delivery owner.
- **smoke-no-local-repo-writes**: Smoke tests default to non-local/non-repo directory environments. Writing smoke test installs/data into the repo directory or its subdirectories is prohibited — use global scope or a temporary directory and clean up after testing. Enforcement: prefer global scope or temp directories. Owner: current delivery owner.
- **iteration-log-completeness**: `docs/logs/v*/README.md` must contain "iteration completion notes / feature description / usage instructions / test verification / release deployment", and the test section must specify commands and observation points. Incomplete logs must be filled in before the stage is considered complete. Enforcement: cross-check against `docs/logs/TEMPLATE.md` item by item. Owner: current delivery owner.
- **no-self-commit-without-request**: Do not commit or push code unless the user explicitly requests it.
- **use-english-when-communicating**: Use English when communicating with the user.
- **complete-all-release-required**: When user instructions contain "complete all / finish everything", the full release closed loop and end-to-end verification must be executed. If unable to execute, clearly state the blocker and mark as incomplete in the iteration log. Enforcement: follow `docs/processes/npm-release-process.md` + remote migrations + full deploy + production smoke. Owner: current delivery owner.
- **all-release-means-all-updates**: When user instructions contain "release all / publish all updates" or similar, default to releasing all components affected by the current changes (including frontend, backend, npm packages, doc sites, etc.). Missing components count as a process defect. Enforcement: enumerate affected components and release/deploy all of them. Owner: current delivery owner.
