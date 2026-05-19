import os from "os";
import path from "path";
import fs from "fs";
import type { InstallScope, Platform, ArtifactType } from "./types.js";

export function getHomeDir(): string {
  const override = process.env.SKILD_HOME?.trim();
  if (override) return path.resolve(override);
  return os.homedir();
}

export function getProjectDir(): string {
  return process.cwd();
}

export function getSkildGlobalDir(): string {
  return path.join(getHomeDir(), ".skild");
}

export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function getSkillsDir(platform: Platform, scope: InstallScope): string {
  const base = scope === "project" ? getProjectDir() : getHomeDir();
  switch (platform) {
    case "claude":
      return path.join(base, ".claude", "skills");
    case "codex":
      return path.join(base, ".codex", "skills");
    case "copilot":
      return path.join(base, ".github", "skills");
    case "antigravity":
      // Antigravity uses a project `.agent/skills/` directory, or a global `~/.gemini/antigravity/skills/` directory.
      return scope === "project"
        ? path.join(getProjectDir(), ".agent", "skills")
        : path.join(getHomeDir(), ".gemini", "antigravity", "skills");
    case "opencode":
      return scope === "project"
        ? path.join(getProjectDir(), ".opencode", "skill")
        : path.join(getHomeDir(), ".config", "opencode", "skill");
    case "cursor":
      return scope === "project"
        ? path.join(getProjectDir(), ".cursor", "skills")
        : path.join(getHomeDir(), ".cursor", "skills");
    case "windsurf":
      return scope === "project"
        ? path.join(getProjectDir(), ".windsurf", "skills")
        : path.join(getHomeDir(), ".windsurf", "skills");
    case "agents":
      return scope === "project"
        ? path.join(getProjectDir(), ".agents", "skills")
        : path.join(getHomeDir(), ".agents", "skills");
  }
}

export function getProjectSkildDir(): string {
  return path.join(getProjectDir(), ".skild");
}

export function getProjectLockPath(): string {
  return path.join(getProjectSkildDir(), "lock.json");
}

export function getGlobalConfigPath(): string {
  return path.join(getSkildGlobalDir(), "config.json");
}

export function getGlobalRegistryAuthPath(): string {
  return path.join(getSkildGlobalDir(), "registry-auth.json");
}

export function getGlobalLockPath(): string {
  return path.join(getSkildGlobalDir(), "lock.json");
}

export function getSkillInstallDir(
  platform: Platform,
  scope: InstallScope,
  skillName: string,
): string {
  return path.join(getSkillsDir(platform, scope), skillName);
}

export function getPromptsDir(platform: Platform, scope: InstallScope): string {
  const base = scope === "project" ? getProjectDir() : getHomeDir();
  switch (platform) {
    case "claude":
      return path.join(base, ".claude", "commands");
    case "codex":
      return path.join(base, ".codex", "prompts");
    case "copilot":
      if (scope === "project")
        return path.join(getProjectDir(), ".github", "prompts");
      // VS Code user data dir is platform-specific
      switch (process.platform) {
        case "darwin":
          return path.join(
            getHomeDir(),
            "Library",
            "Application Support",
            "Code",
            "User",
            "prompts",
          );
        case "linux":
          return path.join(
            process.env.XDG_CONFIG_HOME || path.join(getHomeDir(), ".config"),
            "Code",
            "User",
            "prompts",
          );
        default: // win32
          return path.join(
            process.env.APPDATA ||
              path.join(getHomeDir(), "AppData", "Roaming"),
            "Code",
            "User",
            "prompts",
          );
      }
    case "antigravity":
      return scope === "project"
        ? path.join(getProjectDir(), ".agent", "prompts")
        : path.join(getHomeDir(), ".gemini", "antigravity", "prompts");
    case "opencode":
      return scope === "project"
        ? path.join(getProjectDir(), ".opencode", "prompts")
        : path.join(getHomeDir(), ".config", "opencode", "prompts");
    case "cursor":
      // Cursor has no file-based prompt/command system; return a conventional path
      // but callers should skip this platform for prompts
      return path.join(base, ".cursor", "prompts");
    case "windsurf":
      return path.join(base, ".windsurf", "prompts");
    case "agents":
      return path.join(base, ".agents", "prompts");
  }
}

export function getPromptInstallPath(
  platform: Platform,
  scope: InstallScope,
  promptFileName: string,
): string {
  return path.join(getPromptsDir(platform, scope), promptFileName);
}

export function getPromptMetadataDir(
  platform: Platform,
  scope: InstallScope,
): string {
  return path.join(getPromptsDir(platform, scope), ".skild");
}

export function getPromptInstallRecordPath(
  platform: Platform,
  scope: InstallScope,
  promptName: string,
): string {
  return path.join(getPromptMetadataDir(platform, scope), `${promptName}.json`);
}

export function getArtifactDir(
  platform: Platform,
  scope: InstallScope,
  type: ArtifactType,
): string {
  return type === "prompt"
    ? getPromptsDir(platform, scope)
    : getSkillsDir(platform, scope);
}

export function getSkillMetadataDir(skillInstallDir: string): string {
  return path.join(skillInstallDir, ".skild");
}

export function getSkillInstallRecordPath(skillInstallDir: string): string {
  return path.join(getSkillMetadataDir(skillInstallDir), "install.json");
}
