import { randomUUID } from "node:crypto";
import type { RawEvent, SecurityEvent, EventType, EventActor, EventTarget } from "@cse/shared";
import type { GeoIpEnricher } from "../enrichers/geoip.js";

const PIPELINE_VERSION = "1.0.0";

interface NormalizerOptions {
  geoIpEnricher?: GeoIpEnricher;
}

export class EventNormalizer {
  private geoIpEnricher?: GeoIpEnricher;

  constructor(options: NormalizerOptions = {}) {
    if (options.geoIpEnricher) {
      this.geoIpEnricher = options.geoIpEnricher;
    }
  }

  async normalize(raw: RawEvent): Promise<SecurityEvent> {
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
      await this.enrichActorGeo(event);
    }

    const target = this.extractTarget(raw.payload);
    if (target) {
      event.target = target;
    }

    return event;
  }

  private async enrichActorGeo(event: SecurityEvent): Promise<void> {
    if (!this.geoIpEnricher || !event.actor?.ip) {
      return;
    }

    try {
      const geo = await this.geoIpEnricher.lookup(event.actor.ip);
      if (geo) {
        event.actor.geo = geo;
        event.pipeline.enrichments_applied.push("geoip");
      }
    } catch (error) {
      console.error(`GeoIP lookup failed for ${event.actor.ip}:`, error);
    }
  }

  private inferEventType(raw: RawEvent): EventType {
    const payload = raw.payload;
    const actionValue = payload["action"] ?? payload["eventType"] ?? "";
    const action = (typeof actionValue === "string" ? actionValue : "").toLowerCase();

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
    const value = payload["action"] ?? payload["eventType"] ?? payload["event"] ?? "unknown";
    return typeof value === "string" ? value : "unknown";
  }

  private extractActor(payload: Record<string, unknown>): EventActor | undefined {
    const user = payload["user"] ?? payload["username"] ?? payload["actor"];
    const email = payload["email"] ?? payload["userEmail"];
    const ip = payload["sourceIp"] ?? payload["clientIp"] ?? payload["ip"];

    if (!user && !email && !ip) {
      return undefined;
    }

    const actor: EventActor = {};
    if (typeof user === "string") actor.user = user;
    if (typeof email === "string") actor.email = email;
    if (typeof ip === "string") actor.ip = ip;

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
      type: typeof targetType === "string" ? targetType : "unknown",
    };
    if (typeof name === "string") target.name = name;
    if (typeof ip === "string") target.ip = ip;
    if (typeof port === "number") target.port = port;

    return target;
  }
}
