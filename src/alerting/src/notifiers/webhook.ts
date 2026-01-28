import type { Alert, Notifier } from "../types/rules.js";

export interface WebhookConfig {
  url: string;
  headers?: Record<string, string>;
}

export class WebhookNotifier implements Notifier {
  private config: WebhookConfig;

  constructor(config: WebhookConfig) {
    this.config = config;
  }

  async notify(alert: Alert): Promise<void> {
    const payload = {
      alert_id: alert.id,
      rule_id: alert.rule_id,
      rule_name: alert.rule_name,
      severity: alert.severity,
      message: alert.message,
      triggered_at: alert.triggered_at,
      event: {
        id: alert.event.id,
        type: alert.event.event_type,
        action: alert.event.event_action,
        actor: alert.event.actor,
        source: alert.event.source,
      },
    };

    try {
      const response = await fetch(this.config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.config.headers,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`Webhook failed: ${String(response.status)} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Webhook error: ${error instanceof Error ? error.message : "unknown"}`);
    }
  }
}
