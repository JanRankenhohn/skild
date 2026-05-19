# Extend forked skild package

## Overview

The skild package should be extended to also allow installation of other ai artifacts apart from skills.
It should work the same as for skills for:

- instructions (Copilot) / rules (cursor)
- Agents
- prompts (copilot), commands (cursor)

This should be cross platform IDE but support only VSCode Copilot, Cursor and Claude Code for now - which still makes it probably challenging because there is no default form like the SKILL.md naming convention.
E.g. as far as I know copilot uses .instructions files the land in the user's or project's .github folder but the euqivalent of the other IDEs need to be supported as well.
Also user or project level needs to be supported for all of them.

Everything should work analog to the existing skill handling, but there should be a type option to define what kind of artifacts will be searched and installed.

Let's say in myrepo/prompts I have:

- a Github instructions file for code style guidlenes across my team, a cursur rules file that has the same content
- 2 agent files ("Csharp expert", "azur-analyzer") that are used by some VSCode Devs
- There are 4 prompts that are used for the dev workflow like jira ticket fetching etc.

I would like to pass a type to my skild command that defines what type of artifact I want to add.
For prompt/command files this could be type "prompt".
Skild should then install all prompts from the repo either on user or project level targetting either all or a specific IDE - same as it works at the moment with skills.

---

## AI Artifacts Reference

### 1. Instructions / Rules

**Purpose:** Persistent guidelines that shape how the AI behaves across all interactions — coding style, conventions, constraints, do's and don'ts.

| IDE                   | Name                  | File(s)                                              | Storage                                                                                                             |
| --------------------- | --------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **VS Code (Copilot)** | Instructions          | `.instructions.md` (YAML frontmatter with `applyTo`) | Project: `.github/copilot-instructions.md` or anywhere in workspace. User: `%APPDATA%/Code/User/prompts/`           |
| **Cursor**            | Rules                 | `.mdc` files                                         | Project: `.cursor/rules/`. User: Cursor Settings → Rules                                                            |
| **Claude Code**       | Instructions / Memory | `CLAUDE.md`                                          | Project: `CLAUDE.md` in repo root (+ nested in subdirs). User: `~/.claude/CLAUDE.md`. Enterprise: managed via admin |

**Scopes:**

- **User-level:** Applied globally for that developer
- **Project-level:** Checked into repo, shared with the team
- **Claude Code specifics:** `CLAUDE.md` at repo root = project-level. `~/.claude/CLAUDE.md` = user-level. Claude Code also supports `CLAUDE.md` in subdirectories (scoped to that subtree). Enterprise orgs can push managed instructions via Claude Code's admin settings.

### 2. Agents / Agent Modes

**Purpose:** Specialized AI personas with defined roles, tool restrictions, and behavioral constraints.

| IDE                   | Name                  | File(s)                                                    | Storage                                                                                       |
| --------------------- | --------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **VS Code (Copilot)** | Custom Agents / Modes | `.agent.md` (YAML frontmatter with `tools`, `description`) | Project: anywhere in workspace. User: `%APPDATA%/Code/User/prompts/`                          |
| **Cursor**            | Agent modes           | Configured in settings UI                                  | User-level only                                                                               |
| **Claude Code**       | —                     | No direct equivalent                                       | Claude Code operates as a single agent; you shape behavior via `CLAUDE.md` and slash commands |

**Note:** Claude Code doesn't have named agent personas. Instead, you steer its behavior entirely through `CLAUDE.md` instructions and per-conversation context.

### 3. Prompts / Commands

**Purpose:** Reusable, parameterized prompt templates for common tasks — triggered on demand.

| IDE                   | Name                    | File(s)                                              | Storage                                                              |
| --------------------- | ----------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| **VS Code (Copilot)** | Prompt files            | `.prompt.md` (YAML frontmatter with `mode`, `tools`) | Project: anywhere in workspace. User: `%APPDATA%/Code/User/prompts/` |
| **Cursor**            | Slash commands (custom) | Not file-based; uses Notepad or @ references         | User-level (Notepad)                                                 |
| **Claude Code**       | Slash commands          | Markdown files in `.claude/commands/`                | Project: `.claude/commands/`. User: `~/.claude/commands/`            |

**Claude Code specifics:** Custom slash commands are markdown files. A file at `.claude/commands/review.md` becomes `/project:review`. User-level commands at `~/.claude/commands/review.md` become `/user:review`. Commands can include `$ARGUMENTS` placeholder for parameterization.

### 4. Skills (SKILL.md)

**Purpose:** Packaged domain knowledge + tool instructions the AI loads on-demand.

| IDE                   | Name         | File(s)               | Storage                                                          |
| --------------------- | ------------ | --------------------- | ---------------------------------------------------------------- |
| **VS Code (Copilot)** | Skills       | `SKILL.md` files      | Bundled with extensions or in workspace                          |
| **Cursor**            | Docs (@docs) | Indexed documentation | Settings (URLs or local paths)                                   |
| **Claude Code**       | —            | No direct equivalent  | Closest: referenced docs in `CLAUDE.md` or MCP tool descriptions |

### 5. Context / Memory

**Purpose:** Persistent facts the AI remembers across sessions.

| IDE                   | Name                       | Storage                                                                                      |
| --------------------- | -------------------------- | -------------------------------------------------------------------------------------------- |
| **VS Code (Copilot)** | Memory files               | `/memories/` (user), `/memories/repo/` (project), `/memories/session/` (conversation)        |
| **Cursor**            | Notepad / Long-term memory | User-level storage                                                                           |
| **Claude Code**       | Memory                     | `~/.claude/memory.json` (auto-managed). Also `CLAUDE.md` serves as explicit long-term memory |

### Cross-IDE Equivalence Map

```
Copilot                  ↔  Cursor               ↔  Claude Code
──────────────────────────────────────────────────────────────────────
.instructions.md         ↔  .cursor/rules/*.mdc  ↔  CLAUDE.md
.agent.md                ↔  Agent Modes (UI)      ↔  — (via CLAUDE.md)
.prompt.md               ↔  Notepad / @           ↔  .claude/commands/*.md
SKILL.md                 ↔  @docs                 ↔  — (via CLAUDE.md refs)
copilot-instructions.md  ↔  .cursorrules (legacy) ↔  CLAUDE.md (root)
```

### Claude Code File Structure Summary

```
repo/
├── CLAUDE.md                          # Project-level instructions (team-shared)
├── src/
│   └── CLAUDE.md                      # Subdirectory-scoped instructions
├── .claude/
│   └── commands/
│       ├── review.md                  # /project:review
│       └── deploy.md                  # /project:deploy

~/.claude/
├── CLAUDE.md                          # User-level instructions (all projects)
├── commands/
│   └── my-workflow.md                 # /user:my-workflow
└── memory.json                        # Auto-managed memory
```

### Key Implications for Skild

1. **Claude Code's `CLAUDE.md` is a monolithic file** — unlike Copilot's granular `.instructions.md` per concern, Claude Code concatenates all project instructions into one `CLAUDE.md`. An installer would either append to it or need to manage sections within it.

2. **Claude Code commands map well to prompts** — `.claude/commands/*.md` is the closest equivalent to Copilot's `.prompt.md`. These are file-based and project-level, making them installable.

3. **No agent equivalent in Claude Code** — you'd either skip agent installation for Claude Code or fold agent instructions into `CLAUDE.md`.

4. **Scoping model differs** — Claude Code uses directory hierarchy (`CLAUDE.md` in subdirs) rather than glob patterns (`applyTo` in Copilot). Format conversion would be needed.

5. **User-level paths:**
   - Copilot: `%APPDATA%/Code/User/prompts/`
   - Cursor: `~/.cursor/`
   - Claude Code: `~/.claude/` and `~/.claude/commands/`
