export type DiscoveredSkillInstall = {
  relPath: string;
  suggestedSource: string;
  materializedDir?: string;
  displayName?: string;
  description?: string;
};

export type DiscoveredPromptInstall = {
  relPath: string;
  fileName: string;
  absPath: string;
  suggestedSource: string;
  displayName?: string;
  description?: string;
  metadata?: import("@skild/core").PromptFrontmatter;
};
