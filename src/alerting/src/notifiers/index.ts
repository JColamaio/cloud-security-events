import type { Notifier, NotifierConfig } from "../types/rules.js";
import { ConsoleNotifier } from "./console.js";
import { WebhookNotifier } from "./webhook.js";

export function createNotifier(config: NotifierConfig): Notifier {
  switch (config.type) {
    case "console":
      return new ConsoleNotifier();

    case "webhook": {
      const url = config.config["url"];
      if (typeof url !== "string") {
        throw new Error("Webhook notifier requires 'url' in config");
      }

      const headers = config.config["headers"];
      if (headers && typeof headers === "object" && !Array.isArray(headers)) {
        return new WebhookNotifier({
          url,
          headers: headers as Record<string, string>,
        });
      }

      return new WebhookNotifier({ url });
    }

    case "slack": {
      const url = config.config["webhook_url"];
      if (typeof url !== "string") {
        throw new Error("Slack notifier requires 'webhook_url' in config");
      }
      return new WebhookNotifier({ url });
    }

    default: {
      const _exhaustive: never = config.type;
      throw new Error(`Unknown notifier type: ${String(_exhaustive)}`);
    }
  }
}

export { ConsoleNotifier } from "./console.js";
export { WebhookNotifier } from "./webhook.js";
