import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SQLiteStore } from "../adapters/sqlite-store.js";
import type { SecurityEvent } from "../types/events.js";

function createEvent(overrides: Partial<SecurityEvent> = {}): SecurityEvent {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ingested_at: new Date().toISOString(),
    event_type: "authentication",
    event_action: "login",
    event_severity: "low",
    event_category: ["authentication"],
    source: { type: "app", name: "test" },
    outcome: "success",
    metadata: {},
    pipeline: {
      version: "1.0.0",
      processed_at: new Date().toISOString(),
      enrichments_applied: [],
    },
    ...overrides,
  };
}

describe("SQLiteStore", () => {
  let store: SQLiteStore;

  beforeEach(() => {
    store = new SQLiteStore(":memory:");
  });

  afterEach(async () => {
    await store.close();
  });

  describe("save", () => {
    it("saves an event", async () => {
      const event = createEvent();
      await store.save(event);

      const results = await store.query({});
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe(event.id);
    });

    it("saves event with actor", async () => {
      const event = createEvent({
        actor: { user: "john", ip: "1.2.3.4" },
      });
      await store.save(event);

      const results = await store.query({});
      expect(results[0]?.actor?.user).toBe("john");
      expect(results[0]?.actor?.ip).toBe("1.2.3.4");
    });

    it("saves event with target", async () => {
      const event = createEvent({
        target: { type: "file", name: "/etc/passwd" },
      });
      await store.save(event);

      const results = await store.query({});
      expect(results[0]?.target?.type).toBe("file");
      expect(results[0]?.target?.name).toBe("/etc/passwd");
    });

    it("replaces event with same id", async () => {
      const event = createEvent({ event_action: "login_attempt" });
      await store.save(event);

      event.event_action = "login_success";
      await store.save(event);

      const results = await store.query({});
      expect(results).toHaveLength(1);
      expect(results[0]?.event_action).toBe("login_success");
    });
  });

  describe("query", () => {
    it("returns events ordered by timestamp desc", async () => {
      const old = createEvent({ timestamp: "2026-01-01T00:00:00.000Z" });
      const recent = createEvent({ timestamp: "2026-01-02T00:00:00.000Z" });

      await store.save(old);
      await store.save(recent);

      const results = await store.query({});
      expect(results[0]?.id).toBe(recent.id);
      expect(results[1]?.id).toBe(old.id);
    });

    it("filters by event_type", async () => {
      await store.save(createEvent({ event_type: "authentication" }));
      await store.save(createEvent({ event_type: "network" }));

      const results = await store.query({ event_type: "authentication" });
      expect(results).toHaveLength(1);
      expect(results[0]?.event_type).toBe("authentication");
    });

    it("filters by severity", async () => {
      await store.save(createEvent({ event_severity: "low" }));
      await store.save(createEvent({ event_severity: "critical" }));

      const results = await store.query({ severity: "critical" });
      expect(results).toHaveLength(1);
      expect(results[0]?.event_severity).toBe("critical");
    });

    it("filters by event_action", async () => {
      await store.save(createEvent({ event_action: "login" }));
      await store.save(createEvent({ event_action: "logout" }));

      const results = await store.query({ event_action: "login" });
      expect(results).toHaveLength(1);
      expect(results[0]?.event_action).toBe("login");
    });

    it("filters by time range", async () => {
      await store.save(createEvent({ timestamp: "2026-01-01T00:00:00.000Z" }));
      await store.save(createEvent({ timestamp: "2026-01-15T00:00:00.000Z" }));
      await store.save(createEvent({ timestamp: "2026-01-30T00:00:00.000Z" }));

      const results = await store.query({
        from: "2026-01-10T00:00:00.000Z",
        to: "2026-01-20T00:00:00.000Z",
      });

      expect(results).toHaveLength(1);
      expect(results[0]?.timestamp).toBe("2026-01-15T00:00:00.000Z");
    });

    it("respects limit", async () => {
      for (let i = 0; i < 10; i++) {
        await store.save(createEvent());
      }

      const results = await store.query({ limit: 5 });
      expect(results).toHaveLength(5);
    });

    it("combines filters", async () => {
      await store.save(createEvent({ event_type: "authentication", event_severity: "low" }));
      await store.save(createEvent({ event_type: "authentication", event_severity: "high" }));
      await store.save(createEvent({ event_type: "network", event_severity: "high" }));

      const results = await store.query({
        event_type: "authentication",
        severity: "high",
      });

      expect(results).toHaveLength(1);
      expect(results[0]?.event_type).toBe("authentication");
      expect(results[0]?.event_severity).toBe("high");
    });
  });
});
