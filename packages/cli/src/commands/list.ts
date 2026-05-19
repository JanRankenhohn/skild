import chalk from "chalk";
import {
  PLATFORMS,
  listAllSkills,
  listSkills,
  listPrompts,
  listAllPrompts,
  type Platform,
  type ArtifactType,
} from "@skild/core";
import { Table } from "../utils/table-utils.js";

export interface ListCommandOptions {
  target?: Platform | string;
  local?: boolean;
  json?: boolean;
  paths?: boolean;
  verbose?: boolean;
  type?: string;
}

type Listed = ReturnType<typeof listSkills>[number];

// Platform display names (abbreviated for table headers)
const PLATFORM_ABBREV: Record<Platform, string> = {
  claude: "Claude",
  codex: "Codex",
  copilot: "Copilot",
  cursor: "Cursor",
  antigravity: "Antigravity",
  opencode: "OpenCode",
  windsurf: "Windsurf",
  agents: "Agents",
};

interface SkillRow {
  name: string;
  displayName: string;
  isSkillset: boolean;
  isDependency: boolean;
  platforms: Map<Platform, { installed: boolean; hasSkillMd: boolean }>;
  dependencies?: string[];
  dependedBy?: string[];
  indent: number;
}

function isSkillset(skill: Listed): boolean {
  return Boolean(
    skill.record?.skillset || skill.record?.skill?.frontmatter?.skillset,
  );
}

function getDisplayName(skill: Listed): string {
  return (
    skill.record?.canonicalName ||
    skill.record?.skill?.frontmatter?.name ||
    skill.name
  );
}

function buildSkillMatrix(
  allSkills: ReturnType<typeof listAllSkills>,
): SkillRow[] {
  const skillMap = new Map<string, SkillRow>();

  // First pass: collect all unique skills
  for (const skill of allSkills) {
    const name = skill.name;
    if (!skillMap.has(name)) {
      skillMap.set(name, {
        name,
        displayName: getDisplayName(skill),
        isSkillset: isSkillset(skill),
        isDependency: Boolean(skill.record?.dependedBy?.length),
        platforms: new Map(),
        dependencies: skill.record?.installedDependencies?.map((d) => d.name),
        dependedBy: skill.record?.dependedBy,
        indent: 0,
      });
    }

    const row = skillMap.get(name)!;
    row.platforms.set(skill.platform, {
      installed: true,
      hasSkillMd: skill.hasSkillMd,
    });
  }

  // Sort and group
  const rows = Array.from(skillMap.values());
  const skillsets = rows
    .filter((r) => r.isSkillset)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  const dependencies = rows
    .filter((r) => !r.isSkillset && r.isDependency)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  const regular = rows
    .filter((r) => !r.isSkillset && !r.isDependency)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  // Build final list with dependencies indented under skillsets
  const result: SkillRow[] = [];

  for (const skillset of skillsets) {
    result.push(skillset);
    if (skillset.dependencies && skillset.dependencies.length > 0) {
      const deps = skillset.dependencies
        .map((depName) => skillMap.get(depName))
        .filter((dep): dep is SkillRow => dep !== undefined)
        .sort((a, b) => a.displayName.localeCompare(b.displayName));

      for (const dep of deps) {
        result.push({ ...dep, indent: 1 });
      }
    }
  }

  result.push(...regular);
  result.push(...dependencies);

  return result;
}

function renderStatusIcon(
  status: { installed: boolean; hasSkillMd: boolean } | undefined,
): string {
  if (!status || !status.installed) return chalk.dim("-");
  if (!status.hasSkillMd) return chalk.yellow("⚠");
  return chalk.green("✓");
}

function renderTableView(
  allSkills: ReturnType<typeof listAllSkills>,
  scope: string,
  options: { verbose?: boolean },
): void {
  if (allSkills.length === 0) {
    console.log(chalk.dim("\nNo skills installed."));
    console.log(
      chalk.dim(
        `💡 Use ${chalk.cyan("skild install <source>")} to get started.\n`,
      ),
    );
    return;
  }

  const matrix = buildSkillMatrix(allSkills);
  const activePlatforms = PLATFORMS.filter((p) =>
    allSkills.some((s) => s.platform === p),
  );

  // Build table with new fluent API
  const table = new Table();

  // Add columns: Skill name + one column per active platform
  table.column("Skill", 30, "left");
  for (const platform of activePlatforms) {
    table.column(PLATFORM_ABBREV[platform] || platform, 11, "center");
  }

  // Group rows by type
  const skillsets = matrix.filter((r) => r.isSkillset && r.indent === 0);
  const regular = matrix.filter(
    (r) => !r.isSkillset && !r.isDependency && r.indent === 0,
  );

  // Add skillsets section (only if there are skillsets)
  if (skillsets.length > 0) {
    table.section(`📦 SKILLSETS ${chalk.dim(`(${skillsets.length})`)}`);

    for (const row of skillsets) {
      const nameCell = chalk.cyan(row.displayName);
      const statusCells = activePlatforms.map((p) =>
        renderStatusIcon(row.platforms.get(p)),
      );
      table.row([nameCell, ...statusCells]);

      // Add dependencies if verbose
      if (options.verbose && row.dependencies) {
        const deps = matrix.filter(
          (r) => r.indent > 0 && row.dependencies?.includes(r.name),
        );
        for (const dep of deps) {
          const depName = chalk.dim(`  ├─ ${dep.displayName}`);
          const depStatus = activePlatforms.map((p) => {
            const status = dep.platforms.get(p);
            return status?.installed ? chalk.dim("•") : chalk.dim("-");
          });
          table.row([depName, ...depStatus]);
        }
      }
    }
  }

  // Add regular skills section
  if (regular.length > 0) {
    if (skillsets.length > 0) table.separator();
    table.section(`⚡ SKILLS ${chalk.dim(`(${regular.length})`)}`);

    for (const row of regular) {
      const nameCell = chalk.cyan(row.displayName);
      const statusCells = activePlatforms.map((p) =>
        renderStatusIcon(row.platforms.get(p)),
      );
      table.row([nameCell, ...statusCells]);
    }
  }

  // Render table
  console.log("");
  console.log(table.render());

  // Summary
  const totalSkills = new Set(matrix.map((r) => r.name)).size;
  const totalInstalls = allSkills.length;
  console.log("");
  console.log(
    chalk.dim(
      `Summary: ${totalSkills} unique skill${totalSkills === 1 ? "" : "s"}, ${totalInstalls} total installation${totalInstalls === 1 ? "" : "s"} across ${activePlatforms.length} platform${activePlatforms.length === 1 ? "" : "s"} (${scope})`,
    ),
  );

  // Check for skills that are not synced across all platforms
  if (activePlatforms.length > 1) {
    const unsyncedSkills = regular.filter((row) => {
      const installedCount = activePlatforms.filter(
        (p) => row.platforms.get(p)?.installed,
      ).length;
      return installedCount > 0 && installedCount < activePlatforms.length;
    });

    if (unsyncedSkills.length > 0) {
      console.log("");
      console.log(
        chalk.yellow(
          `💡 ${unsyncedSkills.length} skill${unsyncedSkills.length === 1 ? "" : "s"} not synced across all platforms.`,
        ),
      );
      console.log(
        chalk.dim(
          `   Run ${chalk.cyan("skild sync")} to sync skills across platforms.`,
        ),
      );
    }
  }

  console.log("");
}

export async function list(options: ListCommandOptions = {}): Promise<void> {
  const scope = options.local ? "project" : "global";
  const verbose = Boolean(options.verbose);
  const artifactType: ArtifactType =
    options.type === "prompt" ? "prompt" : "skill";

  // Prompt listing
  if (artifactType === "prompt") {
    return listPromptsView(options, scope);
  }

  const platform = options.target as Platform | undefined;
  if (platform) {
    const skills = listSkills({ platform, scope });

    if (options.json) {
      console.log(JSON.stringify(skills, null, 2));
      return;
    }

    // For single platform, use simplified view
    console.log(
      chalk.bold(`\n${PLATFORM_ABBREV[platform] || platform}`) +
        chalk.dim(` (${scope}, ${skills.length} total)`),
    );

    if (skills.length === 0) {
      console.log(chalk.dim("  No skills installed."));
      console.log(
        chalk.dim(
          `  💡 Use ${chalk.cyan("skild install <source>")} to get started.\n`,
        ),
      );
      return;
    }

    const skillsets = skills
      .filter(isSkillset)
      .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));
    const regular = skills
      .filter((s) => !isSkillset(s) && !s.record?.dependedBy?.length)
      .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));
    const dependencies = skills
      .filter((s) => !isSkillset(s) && s.record?.dependedBy?.length)
      .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));

    if (skillsets.length > 0) {
      console.log(
        chalk.bold(`  📦 Skillsets`) + chalk.dim(` (${skillsets.length})`),
      );
      for (const s of skillsets) {
        const icon = s.hasSkillMd ? chalk.green("✓") : chalk.yellow("⚠");
        console.log(`    ${icon} ${chalk.cyan(getDisplayName(s))}`);
      }
    }

    if (regular.length > 0) {
      console.log("");
      console.log(
        chalk.bold(`  ⚡ Skills`) + chalk.dim(` (${regular.length})`),
      );
      for (const s of regular) {
        const icon = s.hasSkillMd ? chalk.green("✓") : chalk.yellow("⚠");
        console.log(`    ${icon} ${chalk.cyan(getDisplayName(s))}`);
      }
    }

    if (dependencies.length > 0) {
      console.log("");
      console.log(
        chalk.bold(`  🔗 Dependencies`) +
          chalk.dim(` (${dependencies.length})`),
      );
      for (const s of dependencies) {
        const icon = s.hasSkillMd ? chalk.green("✓") : chalk.yellow("⚠");
        const requiredBy = s.record?.dependedBy?.join(", ") || "";
        console.log(
          `    ${icon} ${chalk.cyan(getDisplayName(s))}${requiredBy ? chalk.dim(` ← ${requiredBy}`) : ""}`,
        );
      }
    }

    console.log("");
    return;
  }

  const allSkills = listAllSkills({ scope });

  if (options.json) {
    console.log(JSON.stringify(allSkills, null, 2));
    return;
  }

  renderTableView(allSkills, scope, { verbose });
}

// ============================================================================
// Prompt Listing
// ============================================================================

async function listPromptsView(
  options: ListCommandOptions,
  scope: "global" | "project",
): Promise<void> {
  const platform = options.target as Platform | undefined;

  if (platform) {
    const prompts = listPrompts({ platform, scope });

    if (options.json) {
      console.log(JSON.stringify(prompts, null, 2));
      return;
    }

    console.log(
      chalk.bold(`\nPrompts`) +
        chalk.dim(` — ${platform} (${scope}, ${prompts.length} total)`),
    );

    if (prompts.length === 0) {
      console.log(chalk.dim("  No prompts installed."));
      console.log(
        chalk.dim(
          `  💡 Use ${chalk.cyan("skild install <source> --type prompt")} to get started.\n`,
        ),
      );
      return;
    }

    for (const p of prompts) {
      const desc = p.record?.frontmatter?.description
        ? chalk.dim(` — ${p.record.frontmatter.description}`)
        : "";
      console.log(`  ${chalk.green("✓")} ${chalk.cyan(p.name)}${desc}`);
    }
    console.log("");
    return;
  }

  // All platforms
  const allPrompts = listAllPrompts({ scope });

  if (options.json) {
    console.log(JSON.stringify(allPrompts, null, 2));
    return;
  }

  if (allPrompts.length === 0) {
    console.log(chalk.dim("\nNo prompts installed."));
    console.log(
      chalk.dim(
        `💡 Use ${chalk.cyan("skild install <source> --type prompt")} to get started.\n`,
      ),
    );
    return;
  }

  // Group by platform
  const byPlatform = new Map<Platform, typeof allPrompts>();
  for (const p of allPrompts) {
    const list = byPlatform.get(p.platform) || [];
    list.push(p);
    byPlatform.set(p.platform, list);
  }

  console.log(chalk.bold(`\nPrompts`) + chalk.dim(` (${scope})`));
  for (const [plat, prompts] of byPlatform) {
    console.log(`\n  ${chalk.bold(plat)} ${chalk.dim(`(${prompts.length})`)}`);
    for (const p of prompts) {
      const desc = p.record?.frontmatter?.description
        ? chalk.dim(` — ${p.record.frontmatter.description}`)
        : "";
      console.log(`    ${chalk.green("✓")} ${chalk.cyan(p.name)}${desc}`);
    }
  }

  const totalInstalls = allPrompts.length;
  const uniquePrompts = new Set(
    allPrompts.map((p: { fileName: string }) => p.fileName),
  ).size;
  console.log(
    `\n${chalk.dim(`Summary: ${uniquePrompts} unique prompt${uniquePrompts === 1 ? "" : "s"}, ${totalInstalls} total installation${totalInstalls === 1 ? "" : "s"}`)}\n`,
  );
}
