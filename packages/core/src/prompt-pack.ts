import fs from "fs";
import path from "path";
import type {
  PromptPackFrontmatter,
  SkillValidationIssue,
  SkillValidationResult,
} from "./types.js";
import { parseSkillFrontmatter } from "./skill.js";
import { ensureDir, getVSCodePromptsDir, getSkildGlobalDir } from "./paths.js";
import { registerArtifactType, type ArtifactTypeHandler } from "./artifact.js";

// ---------------------------------------------------------------------------
// PACK.md reading & parsing
// ---------------------------------------------------------------------------

export function readPackMd(dir: string): string | null {
  const filePath = path.join(dir, "PACK.md");
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf8");
}

export function parsePackFrontmatter(
  content: string,
): PromptPackFrontmatter | null {
  const raw = parseSkillFrontmatter(content);
  if (!raw) return null;
  const files = (raw as Record<string, unknown>).files;
  if (!Array.isArray(files)) return null;
  return {
    ...raw,
    files: files as string[],
  } as unknown as PromptPackFrontmatter;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validatePromptPackDir(dir: string): SkillValidationResult {
  const issues: SkillValidationIssue[] = [];
  const content = readPackMd(dir);

  if (!content) {
    issues.push({
      level: "error",
      message: "Missing PACK.md",
      path: path.join(dir, "PACK.md"),
    });
    return { ok: false, issues };
  }

  const raw = parseSkillFrontmatter(content);
  if (!raw) {
    issues.push({
      level: "error",
      message: "PACK.md is missing valid YAML frontmatter (--- ... ---)",
    });
    return { ok: false, issues };
  }

  if (!raw.name || typeof raw.name !== "string") {
    issues.push({
      level: "error",
      message: 'Frontmatter "name" is required and must be a string',
    });
  }
  if (!raw.description || typeof raw.description !== "string") {
    issues.push({
      level: "error",
      message: 'Frontmatter "description" is required and must be a string',
    });
  }

  const files = (raw as Record<string, unknown>).files;
  if (!Array.isArray(files) || files.length === 0) {
    issues.push({
      level: "error",
      message:
        'Frontmatter "files" is required and must be a non-empty array of strings',
    });
  } else {
    for (const file of files) {
      if (typeof file !== "string") {
        issues.push({
          level: "error",
          message: `Frontmatter "files" entries must be strings, got: ${typeof file}`,
        });
        continue;
      }
      const normalized = path.normalize(file);
      if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
        issues.push({
          level: "error",
          message: `File path must be relative and within the pack directory: ${file}`,
        });
        continue;
      }
      if (!fs.existsSync(path.join(dir, file))) {
        issues.push({
          level: "error",
          message: `Listed file not found: ${file}`,
          path: path.join(dir, file),
        });
      }
    }
  }

  return {
    ok: issues.every((i) => i.level !== "error"),
    issues,
    frontmatter: raw,
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

const promptPackHandler: ArtifactTypeHandler = {
  type: "prompt-pack",

  detect(dir: string): boolean {
    return fs.existsSync(path.join(dir, "PACK.md"));
  },

  validate(dir: string): SkillValidationResult {
    return validatePromptPackDir(dir);
  },

  readFrontmatter(dir: string): PromptPackFrontmatter | null {
    const content = readPackMd(dir);
    if (!content) return null;
    return parsePackFrontmatter(content);
  },

  resolveInstallDir(_platform, _scope, name: string): string {
    // Prompt-pack source is stored in ~/.skild/packs/<name>/
    // Individual files are deployed to the VS Code prompts dir by deployFiles().
    return path.join(getSkildGlobalDir(), "packs", name);
  },

  deployFiles(installDir: string): string[] {
    const content = readPackMd(installDir);
    if (!content) return [];
    const frontmatter = parsePackFrontmatter(content);
    if (!frontmatter) return [];

    const promptsDir = getVSCodePromptsDir();
    ensureDir(promptsDir);

    const deployed: string[] = [];
    for (const file of frontmatter.files) {
      const normalized = path.normalize(file);
      if (normalized.startsWith("..") || path.isAbsolute(normalized)) continue;

      const src = path.join(installDir, file);
      const dest = path.join(promptsDir, path.basename(file));
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        deployed.push(dest);
      }
    }
    return deployed;
  },

  removeDeployedFiles(
    _installDir: string,
    installedFiles?: string[],
  ): string[] {
    if (!installedFiles?.length) return [];
    const removed: string[] = [];
    for (const file of installedFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        removed.push(file);
      }
    }
    return removed;
  },
};

registerArtifactType(promptPackHandler);

export { promptPackHandler };
