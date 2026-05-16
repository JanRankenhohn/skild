export { SkildError } from './errors.js';
export { PLATFORMS, ARTIFACT_TYPES } from './types.js';
export type {
  Platform,
  InstallScope,
  ArtifactType,
  InstallOptions,
  ListOptions,
  UpdateOptions,
  SkillFrontmatter,
  SkillValidationResult,
  SkillValidationIssue,
  InstallRecord,
  InstalledDependency,
  DependencySourceType,
  Lockfile,
  GlobalConfig,
  RegistryAuth,
  PromptFrontmatter,
  PromptInstallRecord
} from './types.js';

export {
  loadOrCreateGlobalConfig,
  saveGlobalConfig,
  loadRegistryAuth,
  saveRegistryAuth,
  clearRegistryAuth
} from './storage.js';
export {
  getSkillsDir,
  getSkillInstallDir,
  getPromptsDir,
  getPromptInstallPath,
  getPromptMetadataDir,
  getPromptInstallRecordPath,
  getArtifactDir
} from './paths.js';
export { validateSkillDir, readSkillMd, parseSkillFrontmatter, parseFrontmatter } from './skill.js';
export { initSkill } from './init.js';
export { fetchWithTimeout } from './http.js';
export { assertValidAlias, isValidAlias, normalizeAlias } from './alias.js';
export { materializeSourceToDir, materializeSourceToTemp } from './materialize.js';
export { deriveChildSource, stripSourceRef, toDegitPath } from './source.js';
export {
  DEFAULT_REGISTRY_URL,
  canonicalNameToInstallDirName,
  splitCanonicalName,
  parseRegistrySpecifier,
  resolveRegistryUrl,
  resolveRegistryVersion,
  downloadAndExtractTarball,
  resolveRegistryAlias,
  searchRegistrySkills
} from './registry.js';
export {
  installSkill,
  installRegistrySkill,
  listAllSkills,
  listSkills,
  getSkillInfo,
  uninstallSkill,
  updateSkill,
  validateSkill
} from './lifecycle.js';
