import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type { DetectionRule, RulesConfig } from "../types/rules.js";

export class RuleLoader {
  private rulesDir: string;

  constructor(rulesDir: string) {
    this.rulesDir = rulesDir;
  }

  load(): DetectionRule[] {
    if (!existsSync(this.rulesDir)) {
      console.warn(`Rules directory not found: ${this.rulesDir}`);
      return [];
    }

    const rules: DetectionRule[] = [];

    let files: string[];
    try {
      files = readdirSync(this.rulesDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
    } catch (error) {
      console.error(`Failed to read rules directory: ${this.rulesDir}`, error);
      return [];
    }

    for (const file of files) {
      const filePath = join(this.rulesDir, file);

      try {
        const content = readFileSync(filePath, "utf-8");
        const config = parse(content) as RulesConfig;

        if (config.rules) {
          for (const rule of config.rules) {
            if (rule.enabled === false) continue;
            rules.push({ ...rule, enabled: true });
          }
        }
      } catch (error) {
        console.error(`Failed to load rules from ${file}:`, error);
      }
    }

    return rules;
  }

  loadFromString(yamlContent: string): DetectionRule[] {
    const config = parse(yamlContent) as RulesConfig;
    if (!config.rules) return [];
    return config.rules
      .filter((r) => r.enabled !== false)
      .map((r) => ({ ...r, enabled: true as const }));
  }
}
