import type { Alert, Notifier } from "../types/rules.js";

const SEVERITY_COLORS: Record<string, string> = {
  low: "\x1b[36m",
  medium: "\x1b[33m",
  high: "\x1b[31m",
  critical: "\x1b[35m",
};

const RESET = "\x1b[0m";

export class ConsoleNotifier implements Notifier {
  notify(alert: Alert): Promise<void> {
    const color = SEVERITY_COLORS[alert.severity] ?? "";
    const severityLabel = `[${alert.severity.toUpperCase()}]`;

    console.log(`${color}ALERT ${severityLabel}${RESET} ${alert.rule_name} - ${alert.message}`);
    console.log(`  Event ID: ${alert.event.id}`);
    console.log(`  Triggered: ${alert.triggered_at}`);

    if (alert.event.actor) {
      const actor = alert.event.actor;
      const actorInfo = [actor.user, actor.email, actor.ip].filter(Boolean).join(", ");
      console.log(`  Actor: ${actorInfo}`);

      if (actor.geo) {
        console.log(`  Location: ${actor.geo.city ?? "?"}, ${actor.geo.country ?? "?"}`);
      }
    }

    console.log("");
    return Promise.resolve();
  }
}
