import type { SecurityEvent } from "@cse/shared";
import type { DetectionRule, Alert, Notifier } from "../types/rules.js";
import { RuleEvaluator } from "../engine/rule-evaluator.js";
import { createNotifier } from "../notifiers/index.js";

export class AlertEngine {
  private rules: DetectionRule[];
  private evaluator: RuleEvaluator;
  private notifierCache: Map<string, Notifier[]>;

  constructor(rules: DetectionRule[]) {
    this.rules = rules;
    this.evaluator = new RuleEvaluator();
    this.notifierCache = new Map();
    this.initNotifiers();
  }

  private initNotifiers(): void {
    for (const rule of this.rules) {
      const notifiers = rule.actions.map((action) => createNotifier(action));
      this.notifierCache.set(rule.id, notifiers);
    }
  }

  async process(event: SecurityEvent): Promise<Alert[]> {
    const alerts: Alert[] = [];

    for (const rule of this.rules) {
      const result = this.evaluator.evaluate(event, rule);

      if (result.alert) {
        alerts.push(result.alert);
        await this.sendNotifications(rule.id, result.alert);
      }
    }

    return alerts;
  }

  private async sendNotifications(ruleId: string, alert: Alert): Promise<void> {
    const notifiers = this.notifierCache.get(ruleId) ?? [];

    for (const notifier of notifiers) {
      try {
        await notifier.notify(alert);
      } catch (error) {
        console.error(`Failed to send notification for rule ${ruleId}:`, error);
      }
    }
  }

  getRules(): DetectionRule[] {
    return this.rules;
  }

  close(): void {
    this.evaluator.close();
  }
}
