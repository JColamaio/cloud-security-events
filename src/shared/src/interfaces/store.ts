import type { SecurityEvent } from "../types/events.js";

export interface EventFilter {
  event_type?: string;
  event_action?: string;
  severity?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export interface EventStore {
  save(event: SecurityEvent): Promise<void>;
  query(filter: EventFilter): Promise<SecurityEvent[]>;
  close(): Promise<void>;
}
