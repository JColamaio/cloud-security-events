import type { SecurityEvent } from "@cse/shared";

export type Severity = "low" | "medium" | "high" | "critical";
export type Operator =
  | "eq"
  | "neq"
  | "contains"
  | "not_contains"
  | "in"
  | "not_in"
  | "gt"
  | "lt"
  | "gte"
  | "lte";

export interface FieldCondition {
  field: string;
  operator: Operator;
  value: unknown;
}

export interface AggregationCondition {
  field: string;
  count_threshold: number;
  time_window_seconds: number;
}

export interface RuleConditions {
  event_type?: string | string[];
  event_action?: string | string[];
  field_conditions?: FieldCondition[];
  aggregation?: AggregationCondition;
}

export interface NotifierConfig {
  type: "console" | "webhook" | "slack";
  config: Record<string, unknown>;
}

export interface DetectionRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  severity: Severity;
  conditions: RuleConditions;
  actions: NotifierConfig[];
}

export interface RuleDefinition {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
  severity: Severity;
  conditions: RuleConditions;
  actions: NotifierConfig[];
}

export interface RulesConfig {
  rules?: RuleDefinition[];
}

export interface Alert {
  id: string;
  rule_id: string;
  rule_name: string;
  severity: Severity;
  triggered_at: string;
  event: SecurityEvent;
  message: string;
}

export interface Notifier {
  notify(alert: Alert): Promise<void>;
}
