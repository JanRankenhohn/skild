# Contributing to skild

Thanks for your interest in contributing! This guide covers environment setup, project structure, and the workflow for submitting changes.

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 10 — install with `npm i -g pnpm` or [corepack](https://nodejs.org/api/corepack.html)

## Getting Started

```bash
# Clone the repo
git clone https://github.com/<your-fork>/skild.git
cd skild

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## Project Structure

```
skild/
├── packages/
│   ├── core/          # @skild/core — shared types, paths, lifecycle logic
│   └── cli/           # skild CLI — commands, discovery, user interaction
├── apps/
│   ├── console/       # Publisher console (web app)
│   └── web/           # Marketing site
├── workers/
│   └── registry/      # Cloudflare Worker (registry API)
├── docs/              # Documentation
├── scripts/           # Build, deploy, and dev scripts
└── skills/            # Bundled skills
```

The two npm-published packages are `@skild/core` and `skild` (the CLI). They are version-linked — changes to core bump the CLI as well.

## Development Workflow

### Running the Dev Stack

```bash
# Full dev stack (registry + console + CLI watch)
pnpm dev

# Individual services
pnpm dev:cli          # CLI only (watch mode)
pnpm dev:console      # Console app
pnpm dev:registry     # Local registry worker
pnpm dev:web          # Marketing site
```

### Building

```bash
pnpm build            # Build everything
pnpm build:core       # Core only
pnpm build:cli        # Core + CLI
```

### Validation

Run all three before submitting a PR:

```bash
pnpm build
pnpm typecheck
pnpm lint
```

CI runs these automatically on every PR and push to `main`.

### Running the CLI Locally

```bash
# Build and run a CLI command
pnpm cli install ./my-skill
pnpm cli list
```

## Making Changes

1. **Create a branch** from `main`
2. **Make your changes** — keep commits focused
3. **Validate** — `pnpm build && pnpm typecheck`
4. **Add a changeset** if your change affects published packages (`@skild/core` or `skild`):
   ```bash
   pnpm changeset
   ```
   Follow the prompts to describe the change and select a semver bump level.
5. **Open a PR** against `main`

### When to Add a Changeset

- Bug fixes, new features, or breaking changes to `@skild/core` or `skild` → **yes**
- Doc-only changes, CI changes, internal scripts → **no**

### Code Style

- TypeScript with `strict: true`
- ESM modules (`import`/`export`, no `require`)
- Build tool: [tsup](https://tsup.egoist.dev/)

## Architecture Notes

### Core (`packages/core`)

Platform-agnostic logic: path resolution, install/uninstall lifecycle, storage, types. No CLI dependencies — this package can be used programmatically.

### CLI (`packages/cli`)

User-facing commands built with [Commander](https://github.com/tj/commander.js/). The install pipeline follows a 6-stage pattern:

1. **Parse** — resolve source (local / GitHub / registry)
2. **Materialize** — fetch/clone source to a temp directory
3. **Discover** — find installable artifacts in the source
4. **Select** — prompt user to choose what to install
5. **Execute** — install to target platform directory
6. **Report** — summarize results

New artifact types (e.g. prompts) follow this same pipeline with type-specific discovery and execution logic.

## Useful Links

- [Creating Skills](./docs/creating-skills.md)
- [Publishing Skills](./docs/publishing-skills.md)
- [Skillsets](./docs/skillsets.md)
- [FAQ](./docs/faq.md)
