import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { canonicalNameToInstallDirName, validateSkill, detectArtifactType, type Platform } from '@skild/core';

export interface ValidateCommandOptions {
  target?: Platform | string;
  local?: boolean;
  json?: boolean;
}

export async function validate(target: string | undefined, options: ValidateCommandOptions = {}): Promise<void> {
  const platform = (options.target as Platform) || 'claude';
  const scope = options.local ? 'project' : 'global';
  const value = target || '.';
  const resolvedValue = value.trim().startsWith('@') && value.includes('/') ? canonicalNameToInstallDirName(value.trim()) : value;

  const result = validateSkill(resolvedValue, { platform, scope });

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.ok ? 0 : 1;
    return;
  }

  if (result.ok) {
    let label = 'skill';
    const resolved = path.resolve(resolvedValue);
    if (fs.existsSync(resolved)) {
      label = detectArtifactType(resolved);
    }
    console.log(chalk.green('✓'), `Valid ${label}`);
    if (result.frontmatter?.name) console.log(chalk.dim(`  name: ${result.frontmatter.name}`));
    return;
  }

  console.error(chalk.red('✗'), 'Validation failed');
  for (const issue of result.issues) {
    const color = issue.level === 'error' ? chalk.red : chalk.yellow;
    console.error(`  - ${color(issue.level)}: ${issue.message}`);
  }
  process.exitCode = 1;
}
