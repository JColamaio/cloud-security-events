export type EventType = "authentication" | "network" | "file" | "process" | "audit";

export type EventSeverity = "low" | "medium" | "high" | "critical";

export type EventOutcome = "success" | "failure" | "unknown";

export interface GeoLocation {
  country?: string;
  city?: string;
}

export interface EventSource {
  type: string;
  name: string;
  ip?: string;
  hostname?: string;
}

export interface EventActor {
  user?: string;
  email?: string;
  ip?: string;
  geo?: GeoLocation;
}

export interface EventTarget {
  type: string;
  name?: string;
  ip?: string;
  port?: number;
}

export interface PipelineMetadata {
  version: string;
  processed_at: string;
  enrichments_applied: string[];
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  ingested_at: string;

  event_type: EventType;
  event_action: string;
  event_severity: EventSeverity;
  event_category: string[];

  source: EventSource;
  actor?: EventActor;
  target?: EventTarget;

  outcome: EventOutcome;
  metadata: Record<string, unknown>;
  pipeline: PipelineMetadata;
}

export interface RawEvent {
  source_type: string;
  source_name: string;
  timestamp?: string;
  payload: Record<string, unknown>;
}
