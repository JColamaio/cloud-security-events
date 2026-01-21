import { randomUUID } from "node:crypto";
import type { RawEvent, SecurityEvent, EventType, EventActor, EventTarget } from "@cse/shared";

const PIPELINE_VERSION = "1.0.0";

export class EventNormalizer {
  normalize(raw: RawEvent): SecurityEvent {
    const now = new Date().toISOString();

    const event: SecurityEvent = {
      id: randomUUID(),
      timestamp: raw.timestamp ?? now,
      ingested_at: now,

      event_type: this.inferEventType(raw),
      event_action: this.extractAction(raw),
      event_severity: "low",
      event_category: [],

      source: {
        type: raw.source_type,
        name: raw.source_name,
      },

      outcome: "unknown",
      metadata: raw.payload,

      pipeline: {
        version: PIPELINE_VERSION,
        processed_at: now,
        enrichments_applied: [],
      },
    };

    const actor = this.extractActor(raw.payload);
    if (actor) {
      event.actor = actor;
    }

    const target = this.extractTarget(raw.payload);
    if (target) {
      event.target = target;
    }

    return event;
  }

  private inferEventType(raw: RawEvent): EventType {
    const payload = raw.payload;
    const action = String(payload["action"] ?? payload["eventType"] ?? "").toLowerCase();

    if (action.includes("login") || action.includes("auth") || action.includes("signin")) {
      return "authentication";
    }
    if (action.includes("connect") || action.includes("network") || action.includes("request")) {
      return "network";
    }
    if (action.includes("file") || action.includes("read") || action.includes("write")) {
      return "file";
    }
    if (action.includes("exec") || action.includes("process") || action.includes("spawn")) {
      return "process";
    }

    return "audit";
  }

  private extractAction(raw: RawEvent): string {
    const payload = raw.payload;
    return String(payload["action"] ?? payload["eventType"] ?? payload["event"] ?? "unknown");
  }

  private extractActor(payload: Record<string, unknown>): EventActor | undefined {
    const user = payload["user"] ?? payload["username"] ?? payload["actor"];
    const email = payload["email"] ?? payload["userEmail"];
    const ip = payload["sourceIp"] ?? payload["clientIp"] ?? payload["ip"];

    if (!user && !email && !ip) {
      return undefined;
    }

    const actor: EventActor = {};
    if (user) actor.user = String(user);
    if (email) actor.email = String(email);
    if (ip) actor.ip = String(ip);

    return actor;
  }

  private extractTarget(payload: Record<string, unknown>): EventTarget | undefined {
    const targetType = payload["targetType"] ?? payload["resourceType"];
    const name = payload["target"] ?? payload["resource"] ?? payload["destination"];
    const ip = payload["targetIp"] ?? payload["destinationIp"];
    const port = payload["targetPort"] ?? payload["destinationPort"] ?? payload["port"];

    if (!targetType && !name && !ip) {
      return undefined;
    }

    const target: EventTarget = {
      type: targetType ? String(targetType) : "unknown",
    };
    if (name) target.name = String(name);
    if (ip) target.ip = String(ip);
    if (typeof port === "number") target.port = port;

    return target;
  }
}
