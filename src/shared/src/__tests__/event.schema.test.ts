import { describe, it, expect } from "vitest";
import { SecurityEventSchema, RawEventSchema } from "../schemas/event.schema.js";

describe("SecurityEventSchema", () => {
  const validEvent = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    timestamp: "2024-01-15T10:30:00Z",
    ingested_at: "2024-01-15T10:30:01Z",
    event_type: "authentication",
    event_action: "login_failure",
    event_severity: "medium",
    event_category: ["authentication", "iam"],
    source: { type: "application", name: "web-app" },
    actor: { email: "user@example.com", ip: "192.168.1.1" },
    outcome: "failure",
    metadata: { attempts: 3 },
    pipeline: {
      version: "1.0.0",
      processed_at: "2024-01-15T10:30:02Z",
      enrichments_applied: ["geoip"],
    },
  };

  it("accepts valid event", () => {
    const result = SecurityEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
  });

  it("rejects invalid uuid", () => {
    const result = SecurityEventSchema.safeParse({ ...validEvent, id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid event_type", () => {
    const result = SecurityEventSchema.safeParse({ ...validEvent, event_type: "invalid" });
    expect(result.success).toBe(false);
  });

  it("accepts event without optional actor", () => {
    const { actor: _, ...eventWithoutActor } = validEvent;
    const result = SecurityEventSchema.safeParse(eventWithoutActor);
    expect(result.success).toBe(true);
  });
});

describe("RawEventSchema", () => {
  it("accepts valid raw event", () => {
    const result = RawEventSchema.safeParse({
      source_type: "webhook",
      source_name: "github",
      payload: { action: "push" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts raw event with timestamp", () => {
    const result = RawEventSchema.safeParse({
      source_type: "webhook",
      source_name: "github",
      timestamp: "2024-01-15T10:30:00Z",
      payload: {},
    });
    expect(result.success).toBe(true);
  });
});
