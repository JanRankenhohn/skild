import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from '@skild/core';
import type { PromptFrontmatter } from '@skild/core';

export type DiscoveredPromptFile = {
  relPath: string;
  absPath: string;
  fileName: string;
  metadata?: PromptFrontmatter;
};

const SKIP_DIRS = new Set(['.git', '.skild', 'node_modules', 'dist', 'build', '.wrangler']);

function shouldSkipDir(name: string): boolean {
  return !name || SKIP_DIRS.has(name);
}

export function discoverPromptFiles(
  rootDir: string,
  options: { maxDepth?: number; maxFiles?: number } = {}
): DiscoveredPromptFile[] {
  const maxDepth = options.maxDepth ?? 5;
  const maxFiles = options.maxFiles ?? 200;
  const root = path.resolve(rootDir);
  const found: DiscoveredPromptFile[] = [];
  const stack: Array<{ dir: string; depth: number }> = [{ dir: root, depth: 0 }];

  while (stack.length) {
    const { dir, depth } = stack.pop()!;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.prompt.md')) {
        const absPath = path.join(dir, entry.name);
        const relPath = path.relative(root, absPath).split(path.sep).join('/');
        const metadata = extractPromptMetadata(absPath);
        found.push({ relPath, absPath, fileName: entry.name, metadata: metadata ?? undefined });
        if (found.length >= maxFiles) return found;
      } else if (entry.isDirectory() && depth < maxDepth && !shouldSkipDir(entry.name)) {
        stack.push({ dir: path.join(dir, entry.name), depth: depth + 1 });
      }
    }
  }

  return found;
}

function extractPromptMetadata(filePath: string): PromptFrontmatter | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const raw = parseFrontmatter(content);
    if (!raw) return null;
    return {
      name: typeof raw.name === 'string' ? raw.name : undefined,
      description: typeof raw.description === 'string' ? raw.description : undefined,
      mode: typeof raw.mode === 'string' ? raw.mode : undefined,
      tools: Array.isArray(raw.tools) ? raw.tools.filter((t): t is string => typeof t === 'string') : undefined,
    };
  } catch {
    return null;
  }
}
