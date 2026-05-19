<div align="center">

# 🛡️ skild

**Get your agents skilled.**

_The npm for Agent Skills — Discover, install, manage, and publish AI Agent Skills with ease_

[![npm version](https://img.shields.io/npm/v/skild.svg)](https://www.npmjs.com/package/skild)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[Website](https://skild.sh) · [Documentation](./docs/README.md) · [Skild Hub](https://hub.skild.sh)

</div>

---

## 🚀 Quick Start

```bash
npm i -g skild
skild install anthropics/skills
skild list
skild update
skild push owner/repo --dir ./my-skill
```

That's it. Your agent is ready to install and manage skills.

## 🧭 Command Overview

| Command                                | Description                                            |
| -------------------------------------- | ------------------------------------------------------ |
| `skild install <source>`               | Install a Skill or Prompt (Git URL / local / registry) |
| `skild install <source> --type prompt` | Install `.prompt.md` files into IDE prompt dirs        |
| `skild list`                           | List installed Skills or Prompts                       |
| `skild info <skill>`                   | Show Skill details                                     |
| `skild update [skill]`                 | Update installed Skills                                |
| `skild sync [skills...]`               | Auto-detect missing installs and sync                  |
| `skild uninstall <skill>`              | Remove a Skill or Prompt                               |
| `skild init <name>`                    | Create a new Skill project                             |
| `skild validate [path\|skill]`         | Validate a Skill folder or installed Skill             |
| `skild push <repo>`                    | Push a Skill to a Git repository                       |
| `skild extract-github-skills <source>` | Extract GitHub Skills into a local catalog             |
| `skild search <query>`                 | Search the registry                                    |
| `skild signup`                         | Create a publisher account                             |
| `skild login`                          | Login to registry                                      |
| `skild whoami`                         | Show current identity                                  |
| `skild logout`                         | Remove credentials                                     |
| `skild publish`                        | Publish a Skill to the registry                        |

Run `skild <command> --help` for full options.

## 📖 What is this?

[Agent Skills](https://agentskills.io) is an open standard by Anthropic for extending AI agents. **skild** is the package manager for these Skills — like npm, but for AI agents.

## 📦 Install Skills

```bash
# From GitHub (degit shorthand)
skild install anthropics/skills/skills/pdf

# From full GitHub URL
skild install https://github.com/anthropics/skills/tree/main/skills/pdf

# From local directory
skild install ./my-skill

# From registry
skild install @publisher/skill-name

# Force reinstall
skild install anthropics/skills/skills/pdf --force
```

## 🎁 Skillsets: One Pack, Many Skills

Skillsets bundle multiple skills together — install a complete toolkit with one command:

```bash
# Install a data analyst toolkit (includes csv, pandas, sql-helper...)
skild install @skild/data-analyst-pack

# All bundled skills are automatically installed
skild list
```

See **[Skillsets Guide](./docs/skillsets.md)** for more.

## 🎯 Multi-platform Support

Default: Claude (`~/.claude/skills`). Also supports Codex, Copilot, Antigravity, OpenCode, Cursor, Windsurf:

```bash
# Install to Codex (global)
skild install anthropics/skills/skills/pdf -t codex

# Install to OpenCode (global)
skild install anthropics/skills/skills/pdf -t opencode

# Install to Cursor (global)
skild install anthropics/skills/skills/pdf -t cursor

# Install to Windsurf (global)
skild install anthropics/skills/skills/pdf -t windsurf

# Install to Codex (project-level)
skild install anthropics/skills/skills/pdf -t codex --local

# Install to Antigravity (project-level, ./.agent/skills)
skild install anthropics/skills/skills/pdf -t antigravity --local

# Install to OpenCode (project-level, ./.opencode/skill)
skild install anthropics/skills/skills/pdf -t opencode --local

# Install to Cursor (project-level, ./.cursor/skills)
skild install anthropics/skills/skills/pdf -t cursor --local

# Install to Windsurf (project-level, ./.windsurf/skills)
skild install anthropics/skills/skills/pdf -t windsurf --local
```

## 📝 Prompt & Command Support

Install `.prompt.md` and command files for any supported IDE — same sources, same workflow:

```bash
# Install prompts from a local directory
skild install ./my-prompts --type prompt

# Install prompts from GitHub
skild install owner/repo --type prompt

# Target a specific IDE
skild install ./my-prompts --type prompt -t copilot
skild install ./my-prompts --type prompt -t claude

# List installed prompts
skild list --type prompt

# Uninstall a prompt
skild uninstall my-prompt --type prompt
```

Prompts are installed as individual files (not directories) into each IDE's native prompt/command location:

| IDE             | User-level path                  |
| --------------- | -------------------------------- |
| **Copilot**     | `%APPDATA%/Code/User/prompts/`   |
| **Claude Code** | `~/.claude/commands/`            |
| **Codex**       | `~/.codex/prompts/`              |
| **Windsurf**    | `~/.windsurf/prompts/`           |
| **OpenCode**    | `~/.config/opencode/prompts/`    |
| **Antigravity** | `~/.gemini/antigravity/prompts/` |

Use `--local` to install to project-level prompt directories instead.

## 🔧 Manage Skills

```bash
skild list                 # List installed Skills
skild info pdf             # Show Skill details
skild validate pdf         # Validate Skill structure
skild update pdf           # Update a Skill
skild uninstall pdf        # Remove a Skill
skild push owner/repo --dir ./my-skill  # Push a Skill to a Git repo
skild sync                 # Auto-detect and sync missing installs across platforms (tree prompt)
```

## 🔄 Cross-platform Sync

Keep multiple tools in lockstep:

```bash
# Detect missing installs and choose with a tree (All → Platform → Skill)
skild sync

# Limit to certain skills / platforms
skild sync pdf web-scraper --to codex,cursor

# Non-interactive, overwrite existing
skild sync --yes --force
```

## ✨ Create Skills

```bash
skild init my-skill        # Create a new Skill project
cd my-skill
skild validate .           # Validate structure
```

Ready to share? See **[Publishing Skills](./docs/publishing-skills.md)** for the complete guide.

## 📚 Documentation

- **[Quick Start](./docs/getting-started.md)** — Get up and running in 2 minutes
- **[Installing Skills](./docs/installing-skills.md)** — All ways to install Skills
- **[Skillsets](./docs/skillsets.md)** — Install multiple Skills with one command
- **[Creating Skills](./docs/creating-skills.md)** — Build your own Skills
- **[Publishing Skills](./docs/publishing-skills.md)** — Share with the community
- **[Submit from GitHub](./docs/submit-from-github.md)** — Index GitHub Skills
- **[Skild Hub Guide](./docs/hub.md)** — Web interface walkthrough
- **[FAQ](./docs/faq.md)** — Common questions

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## 📄 License

MIT © [Peiiii](https://github.com/Peiiii)

---

<div align="center">

**🛡️ [skild.sh](https://skild.sh)**

_Get your agents skilled._

</div>
