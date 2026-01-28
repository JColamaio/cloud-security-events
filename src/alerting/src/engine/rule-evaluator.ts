import { randomUUID } from "node:crypto";
import type { SecurityEvent } from "@cse/shared";
import type { DetectionRule, FieldCondition, Alert, Operator } from "../types/rules.js";
import { EventAggregator } from "./aggregator.js";

export interface EvaluationResult {
  alert: Alert | null;
  aggregationCount?: number;
}

export class RuleEvaluator {
  private aggregator: EventAggregator;

  constructor(aggregator?: EventAggregator) {
    this.aggregator = aggregator ?? new EventAggregator();
  }

  evaluate(event: SecurityEvent, rule: DetectionRule): EvaluationResult {
    if (!this.matchesEventType(event, rule)) {
      return { alert: null };
    }

    if (!this.matchesEventAction(event, rule)) {
      return { alert: null };
    }

    if (!this.matchesFieldConditions(event, rule)) {
      return { alert: null };
    }

    // If rule has aggregation, check threshold
    if (rule.conditions.aggregation) {
      const result = this.aggregator.track(rule.id, event, rule.conditions.aggregation);

      if (!result.triggered) {
        return { alert: null, aggregationCount: result.count };
      }

      return {
        alert: this.createAggregatedAlert(event, rule, result.count),
        aggregationCount: result.count,
      };
    }

    return { alert: this.createAlert(event, rule) };
  }

  close(): void {
    this.aggregator.close();
  }

  private matchesEventType(event: SecurityEvent, rule: DetectionRule): boolean {
    const { event_type } = rule.conditions;
    if (!event_type) return true;

    if (Array.isArray(event_type)) {
      return event_type.includes(event.event_type);
    }
    return event.event_type === event_type;
  }

  private matchesEventAction(event: SecurityEvent, rule: DetectionRule): boolean {
    const { event_action } = rule.conditions;
    if (!event_action) return true;

    if (Array.isArray(event_action)) {
      return event_action.includes(event.event_action);
    }
    return event.event_action === event_action;
  }

  private matchesFieldConditions(event: SecurityEvent, rule: DetectionRule): boolean {
    const { field_conditions } = rule.conditions;
    if (!field_conditions || field_conditions.length === 0) return true;

    return field_conditions.every((condition) => this.evaluateCondition(event, condition));
  }

  private evaluateCondition(event: SecurityEvent, condition: FieldCondition): boolean {
    const value = this.getNestedValue(event, condition.field);
    return this.compareValues(value, condition.operator, condition.value);
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    const parts = path.split(".");
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  private compareValues(actual: unknown, operator: Operator, expected: unknown): boolean {
    switch (operator) {
      case "eq":
        return actual === expected;

      case "neq":
        return actual !== expected;

      case "contains":
        if (typeof actual === "string" && typeof expected === "string") {
          return actual.includes(expected);
        }
        return false;

      case "not_contains":
        if (typeof actual === "string" && typeof expected === "string") {
          return !actual.includes(expected);
        }
        return true;

      case "in":
        if (Array.isArray(expected)) {
          return expected.includes(actual);
        }
        return false;

      case "not_in":
        if (Array.isArray(expected)) {
          return !expected.includes(actual);
        }
        return true;

      case "gt":
        return typeof actual === "number" && typeof expected === "number" && actual > expected;

      case "lt":
        return typeof actual === "number" && typeof expected === "number" && actual < expected;

      case "gte":
        return typeof actual === "number" && typeof expected === "number" && actual >= expected;

      case "lte":
        return typeof actual === "number" && typeof expected === "number" && actual <= expected;

      default:
        return false;
    }
  }

  private createAlert(event: SecurityEvent, rule: DetectionRule): Alert {
    return {
      id: randomUUID(),
      rule_id: rule.id,
      rule_name: rule.name,
      severity: rule.severity,
      triggered_at: new Date().toISOString(),
      event,
      message: this.formatMessage(event, rule),
    };
  }

  private createAggregatedAlert(event: SecurityEvent, rule: DetectionRule, count: number): Alert {
    const aggregation = rule.conditions.aggregation;
    if (!aggregation) {
      throw new Error("createAggregatedAlert called without aggregation condition");
    }

    const fieldValue = this.getNestedValue(event, aggregation.field);

    return {
      id: randomUUID(),
      rule_id: rule.id,
      rule_name: rule.name,
      severity: rule.severity,
      triggered_at: new Date().toISOString(),
      event,
      message: this.formatAggregatedMessage(
        rule,
        count,
        fieldValue,
        aggregation.time_window_seconds
      ),
    };
  }

  private formatMessage(event: SecurityEvent, rule: DetectionRule): string {
    const actor = event.actor?.user ?? event.actor?.email ?? event.actor?.ip ?? "unknown";
    return `${rule.name}: ${event.event_action} by ${actor}`;
  }

  private formatAggregatedMessage(
    rule: DetectionRule,
    count: number,
    fieldValue: unknown,
    windowSeconds: number
  ): string {
    const fieldStr = typeof fieldValue === "string" ? fieldValue : String(fieldValue);
    return `${rule.name}: ${String(count)} occurrences from ${fieldStr} in ${String(windowSeconds)}s`;
  }
}
