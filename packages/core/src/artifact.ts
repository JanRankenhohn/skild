import fs from "fs";
import path from "path";
import type {
  ArtifactType,
  Platform,
  InstallScope,
  SkillFrontmatter,
  PromptPackFrontmatter,
  SkillValidationResult,
} from "./types.js";
import {
  validateSkillDir,
  readSkillMd,
  parseSkillFrontmatter,
} from "./skill.js";
import { getSkillInstallDir } from "./paths.js";

export interface ArtifactTypeHandler {
  readonly type: ArtifactType;

  /** Check if a directory contains this artifact type */
  detect(dir: string): boolean;

  /** Validate the artifact directory */
  validate(dir: string): SkillValidationResult;

  /** Read metadata frontmatter */
  readFrontmatter(dir: string): SkillFrontmatter | PromptPackFrontmatter | null;

  /** Resolve the directory where the artifact and its metadata are stored */
  resolveInstallDir(
    platform: Platform,
    scope: InstallScope,
    name: string,
  ): string;

  /**
   * Deploy artifact files to their final destination after the source has been
   * stored in the install directory. Returns absolute paths of deployed files.
   * For skills this is a no-op (the install dir IS the deployment target).
   * For prompt-packs: copy individual files to VS Code prompts dir.
   */
  deployFiles(installDir: string): string[];

  /**
   * Remove previously deployed files. Called before uninstalling.
   * Returns absolute paths of files that were removed.
   */
  removeDeployedFiles(installDir: string, installedFiles?: string[]): string[];
}

// ---------------------------------------------------------------------------
// Handler registry
// ---------------------------------------------------------------------------

const handlers = new Map<ArtifactType, ArtifactTypeHandler>();

export function registerArtifactType(handler: ArtifactTypeHandler): void {
  handlers.set(handler.type, handler);
}

export function getArtifactHandler(type: ArtifactType): ArtifactTypeHandler {
  const handler = handlers.get(type);
  if (!handler)
    throw new Error(`No handler registered for artifact type: ${type}`);
  return handler;
}

/**
 * Auto-detect the artifact type from a directory.
 * Non-skill types are checked first; falls back to 'skill'.
 */
export function detectArtifactType(dir: string): ArtifactType {
  for (const handler of handlers.values()) {
    if (handler.type !== "skill" && handler.detect(dir)) return handler.type;
  }
  return "skill";
}

// ---------------------------------------------------------------------------
// Built-in handler: skill (wraps existing skill.ts logic)
// ---------------------------------------------------------------------------

const skillHandler: ArtifactTypeHandler = {
  type: "skill",

  detect(dir: string): boolean {
    return fs.existsSync(path.join(dir, "SKILL.md"));
  },

  validate(dir: string): SkillValidationResult {
    return validateSkillDir(dir);
  },

  readFrontmatter(dir: string): SkillFrontmatter | null {
    const content = readSkillMd(dir);
    if (!content) return null;
    return parseSkillFrontmatter(content);
  },

  resolveInstallDir(
    platform: Platform,
    scope: InstallScope,
    name: string,
  ): string {
    return getSkillInstallDir(platform, scope, name);
  },

  deployFiles(): string[] {
    return [];
  },

  removeDeployedFiles(): string[] {
    return [];
  },
};

registerArtifactType(skillHandler);

export { skillHandler };
