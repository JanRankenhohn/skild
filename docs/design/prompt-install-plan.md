# Plan: Prompt/Command Artifact Support for Skild

## TL;DR

Extend skild's existing install pipeline with a `--type prompt` flag to discover, install, list, and uninstall `.prompt.md` / command files from any source (local, GitHub, registry) — placing them in the correct IDE-specific directory. Reuses the existing 6-stage pipeline; no new commands.

## Target IDE Prompt/Command Paths

| IDE              | Project-level                                       | User-level                             |
| ---------------- | --------------------------------------------------- | -------------------------------------- |
| **Copilot**      | `.github/prompts/` (auto-discovered from workspace) | `%APPDATA%/Code/User/prompts/`         |
| **Cursor**       | Skip (no file-based command system)                 | Skip                                   |
| **Claude Code**  | `.claude/commands/` → becomes `/project:<name>`     | `~/.claude/commands/` → `/user:<name>` |
| **Codex**        | `.codex/prompts/` (convention)                      | `~/.codex/prompts/`                    |
| **Windsurf**     | `.windsurf/prompts/` (convention)                   | `~/.windsurf/prompts/`                 |
| **OpenCode**     | `.opencode/prompts/` (convention)                   | `~/.config/opencode/prompts/`          |
| **Antigravity**  | `.agent/prompts/`                                   | `~/.gemini/antigravity/prompts/`       |
| **Agents**       | `.agents/prompts/`                                  | `~/.agents/prompts/`                   |

## Key Differences from Skills

1. **Discovery**: Skills use `SKILL.md` sentinel file per directory. Prompts are individual `.prompt.md` files — discovery scans for file matches, not directory matches.
2. **Installation unit**: A skill = a directory. A prompt = a single file (possibly with metadata frontmatter).
3. **No validation**: Prompts don't require `name`/`description` frontmatter like `SKILL.md`. Validation is optional/lighter.
4. **No dependencies**: Prompts don't have dependency trees.
5. **Flat install**: Prompts are copied as individual files into the target dir, not as subdirectories.

---

## Implementation Steps

### Phase A: Core Type & Path Extensions

**Step 1: Add `ArtifactType` to core types** *(no dependencies)*

- File: `packages/core/src/types.ts`
- Add `export const ARTIFACT_TYPES = ['skill', 'prompt'] as const;` and `export type ArtifactType`
- Add `artifactType?: ArtifactType` to `InstallOptions`, `ListOptions`, `UpdateOptions`
- Add `artifactType?: ArtifactType` to `InstallRecord` (default `'skill'` for backward compat)
- Export from `packages/core/src/index.ts`

**Step 2: Add `getPromptsDir()` to path resolution** *(depends on 1)*

- File: `packages/core/src/paths.ts`
- New function `getPromptsDir(platform: Platform, scope: InstallScope): string` — same switch/case pattern as `getSkillsDir()` but with prompt-specific paths per the table above
- New function `getPromptInstallPath(platform, scope, promptFileName): string` — returns full file path (not a directory like skills)
- Generalized: `getArtifactDir(platform, scope, type): string` that delegates to `getSkillsDir` or `getPromptsDir`
- Export from index

### Phase B: Prompt Discovery

**Step 3: Create prompt discovery module** *(depends on 1)*

- New file: `packages/cli/src/commands/prompt-discovery.ts`
- Function `discoverPromptFiles(rootDir, options)`: scans directory tree for `*.prompt.md` files (glob match)
- Returns `DiscoveredPromptFile[]` with `{ relPath, absPath, fileName, metadata? }`
- Reuse `shouldSkipDir()` from `install-discovery.ts` (or extract into shared utility)
- Metadata extraction: parse YAML frontmatter if present (mode, description, tools) — use existing `parseSkillFrontmatter()` pattern but with optional fields

**Step 4: Add prompt-specific install types** *(depends on 1)*

- File: `packages/cli/src/commands/install-types.ts`
- Add `DiscoveredPromptInstall` type: `{ relPath, fileName, suggestedSource, materializedDir?, displayName?, description? }`

### Phase C: Core Lifecycle for Prompts

**Step 5: Add prompt install/list/uninstall to lifecycle** *(depends on 1, 2)*

- File: `packages/core/src/lifecycle.ts`
- New function `installPrompt(input, options)`:
  1. Resolve platform/scope
  2. `getPromptsDir()` + `ensureDir()`
  3. Copy the `.prompt.md` file (not directory) to target dir
  4. Write install record (lighter version — stored in `.skild/prompts/<name>.json` or similar)
  5. Return `InstallRecord` with `artifactType: 'prompt'`
- New function `listPrompts(options)`:
  1. `getPromptsDir()` → scan for prompt files
  2. Read associated install records
  3. Return `ListedPrompt[]`
- New function `uninstallPrompt(name, options)`:
  1. Delete the prompt file from target dir
  2. Remove install record
- Export all from index

**Step 6: Prompt install record storage** *(depends on 5)*

- File: `packages/core/src/storage.ts`
- Prompt metadata stored in `<promptsDir>/.skild/` directory (hidden metadata alongside prompt files)
- Functions: `writePromptRecord()`, `readPromptRecord()`, `removePromptRecord()`
- Uses same pattern as skill install records but keyed by filename

### Phase D: CLI Integration

**Step 7: Wire `--type` into the install command** *(depends on 3, 4, 5)*

- File: `packages/cli/src/commands/install.ts`
- Add `type?: string` to `InstallCommandOptions`
- In `createContext()`: parse `options.type` → set `ctx.artifactType` (default `'skill'`)
- In `discoverSkills()`: branch on `ctx.artifactType`:
  - `'skill'`: existing logic (unchanged)
  - `'prompt'`: call `discoverPromptFiles()` instead, map to `DiscoveredPromptInstall[]`
- In `executeInstalls()`: branch on `ctx.artifactType`:
  - `'skill'`: existing `installSkill()` / `installRegistrySkill()`
  - `'prompt'`: call `installPrompt()` per discovered file × platform
- In `reportResults()`: adjust messaging ("Installed N prompts" vs "Installed N skills")

**Step 8: Add `--type` to commander setup** *(depends on 7)*

- File: `packages/cli/src/index.ts`
- Add `.option('--type <type>', 'Artifact type: skill, prompt (default: skill)')` to `install` command
- Add `--type` to `list`, `uninstall`, `update` commands as well

**Step 9: Wire `--type` into list command** *(depends on 5, 8)*

- File: `packages/cli/src/commands/list.ts`
- When `options.type === 'prompt'`: call `listPrompts()` instead of `listSkills()`
- Adjust table output (prompts are files, not directories)

**Step 10: Wire `--type` into uninstall command** *(depends on 5, 8)*

- File: `packages/cli/src/commands/uninstall.ts`
- When `options.type === 'prompt'`: call `uninstallPrompt()` instead of `uninstallSkill()`

### Phase E: Validation & Testing

**Step 11: Build + lint + tsc** *(depends on all above)*

- Run full validation: `pnpm build && pnpm lint && pnpm tsc`

**Step 12: Smoke tests** *(depends on 11)*

- Test 1: `skild install <local-dir-with-prompt-files> --type prompt --target copilot -y`
  - Verify files land in `~/.github/prompts/` (or project-level equivalent)
- Test 2: `skild list --type prompt`
  - Verify prompts are listed
- Test 3: `skild uninstall <prompt-name> --type prompt --target copilot`
  - Verify prompt file and metadata removed
- Test 4: `skild install <github-repo-with-prompts> --type prompt --target claude -y`
  - Verify files land in `~/.claude/commands/`
- Test 5: backward compat — `skild install <skill-source>` without `--type` works as before

---

## Relevant Files

| File                                             | Change                                              |
| ------------------------------------------------ | --------------------------------------------------- |
| `packages/core/src/types.ts`                     | Add `ArtifactType`, extend `InstallRecord`/options  |
| `packages/core/src/paths.ts`                     | Add `getPromptsDir()`, `getArtifactDir()`           |
| `packages/core/src/lifecycle.ts`                 | Add `installPrompt()`, `listPrompts()`, `uninstall` |
| `packages/core/src/storage.ts`                   | Prompt record read/write                            |
| `packages/core/src/index.ts`                     | Export new types and functions                       |
| `packages/cli/src/index.ts`                      | Add `--type` option to commands                     |
| `packages/cli/src/commands/install.ts`           | Branch pipeline on `artifactType`                   |
| `packages/cli/src/commands/install-types.ts`     | Add `DiscoveredPromptInstall`                       |
| `packages/cli/src/commands/prompt-discovery.ts`  | **NEW** — prompt file discovery                     |
| `packages/cli/src/commands/list.ts`              | Branch on type                                      |
| `packages/cli/src/commands/uninstall.ts`         | Branch on type                                      |

---

## Decisions

- **Backward compatibility**: `--type` defaults to `'skill'` — all existing behavior unchanged.
- **No format conversion in v1**: Copilot `.prompt.md` files are copied as-is. Claude Code files are copied to `.claude/commands/`. No content transformation between IDE formats.
- **Cursor**: Skipped with info message — no file-based prompt/command system exists.
- **Install unit**: Single files, not directories. Each `.prompt.md` file = one installable unit.
- **Install record location**: `.skild/` subdirectory inside the prompts directory (e.g. `~/.github/prompts/.skild/`).
- **Registry support**: Deferred — prompts install from local/GitHub sources only in v1. Registry can come later by adding a `type` field to registry packages.
- **Prompt frontmatter**: Optional. If present, `name` and `description` are used for display. If absent, filename is used.

## Open Questions

1. **Cursor support**: Skip entirely for prompts, or install to `.cursor/prompts/` convention? Recommendation: skip with message in v1, revisit when Cursor adds file-based commands.
2. **Multi-IDE format conversion** (e.g. `.prompt.md` → Claude Code `$ARGUMENTS` syntax): Out of scope for v1, but the file-based architecture makes it straightforward to add later as a transformation step in `installPrompt()`.

## Verification Checklist

1. `pnpm build && pnpm lint` — no errors
2. `pnpm tsc --noEmit` across both packages — no type errors
3. Smoke: install prompts from local dir with `.prompt.md` files → verify file placement per IDE
4. Smoke: list installed prompts → verify output
5. Smoke: uninstall a prompt → verify file removal
6. Smoke: install skills without `--type` → verify no regression
7. Unit: `discoverPromptFiles()` finds `.prompt.md` files and ignores non-prompt files
