import { describe, it, expect } from "vitest";
import { EventNormalizer } from "../services/normalizer.js";
import { MockGeoIpEnricher } from "../enrichers/geoip.js";
import type { RawEvent } from "@cse/shared";

describe("EventNormalizer", () => {
  describe("event type inference", () => {
    const normalizer = new EventNormalizer();

    it("infers authentication from login action", async () => {
      const raw: RawEvent = {
        source_type: "app",
        source_name: "test",
        payload: { action: "login_success" },
      };

      const event = await normalizer.normalize(raw);
      expect(event.event_type).toBe("authentication");
    });

    it("infers authentication from signin action", async () => {
      const raw: RawEvent = {
        source_type: "app",
        source_name: "test",
        payload: { action: "user_signin" },
      };

      const event = await normalizer.normalize(raw);
      expect(event.event_type).toBe("authentication");
    });

    it("infers network from connect action", async () => {
      const raw: RawEvent = {
        source_type: "firewall",
        source_name: "pfsense",
        payload: { action: "connection_established" },
      };

      const event = await normalizer.normalize(raw);
      expect(event.event_type).toBe("network");
    });

    it("infers file from file_read action", async () => {
      const raw: RawEvent = {
        source_type: "app",
        source_name: "test",
        payload: { action: "file_read" },
      };

      const event = await normalizer.normalize(raw);
      expect(event.event_type).toBe("file");
    });

    it("infers process from exec action", async () => {
      const raw: RawEvent = {
        source_type: "agent",
        source_name: "osquery",
        payload: { action: "process_exec" },
      };

      const event = await normalizer.normalize(raw);
      expect(event.event_type).toBe("process");
    });

    it("defaults to audit for unknown actions", async () => {
      const raw: RawEvent = {
        source_type: "app",
        source_name: "test",
        payload: { action: "something_else" },
      };

      const event = await normalizer.normalize(raw);
      expect(event.event_type).toBe("audit");
    });
  });

  describe("actor extraction", () => {
    const normalizer = new EventNormalizer();

    it("extracts user from payload", async () => {
      const raw: RawEvent = {
        source_type: "app",
        source_name: "test",
        payload: { action: "login", user: "john" },
      };

      const event = await normalizer.normalize(raw);
      expect(event.actor?.user).toBe("john");
    });

    it("extracts email from payload", async () => {
      const raw: RawEvent = {
        source_type: "app",
        source_name: "test",
        payload: { action: "login", email: "john@example.com" },
      };

      const event = await normalizer.normalize(raw);
      expect(event.actor?.email).toBe("john@example.com");
    });

    it("extracts ip from payload", async () => {
      const raw: RawEvent = {
        source_type: "app",
        source_name: "test",
        payload: { action: "login", ip: "1.2.3.4" },
      };

      const event = await normalizer.normalize(raw);
      expect(event.actor?.ip).toBe("1.2.3.4");
    });

    it("returns no actor when no actor fields present", async () => {
      const raw: RawEvent = {
        source_type: "app",
        source_name: "test",
        payload: { action: "system_event" },
      };

      const event = await normalizer.normalize(raw);
      expect(event.actor).toBeUndefined();
    });
  });

  describe("geoip enrichment", () => {
    const geoIpEnricher = new MockGeoIpEnricher();
    const normalizer = new EventNormalizer({ geoIpEnricher });

    it("enriches actor with geo data for public IP", async () => {
      const raw: RawEvent = {
        source_type: "app",
        source_name: "test",
        payload: { action: "login", ip: "190.100.50.25" },
      };

      const event = await normalizer.normalize(raw);
      expect(event.actor?.geo).toEqual({ country: "AR", city: "Buenos Aires" });
      expect(event.pipeline.enrichments_applied).toContain("geoip");
    });

    it("does not enrich for private IP", async () => {
      const raw: RawEvent = {
        source_type: "app",
        source_name: "test",
        payload: { action: "login", ip: "192.168.1.1" },
      };

      const event = await normalizer.normalize(raw);
      expect(event.actor?.geo).toBeUndefined();
      expect(event.pipeline.enrichments_applied).not.toContain("geoip");
    });
  });

  describe("event structure", () => {
    const normalizer = new EventNormalizer();

    it("generates valid uuid", async () => {
      const raw: RawEvent = {
        source_type: "app",
        source_name: "test",
        payload: { action: "test" },
      };

      const event = await normalizer.normalize(raw);
      expect(event.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it("preserves source info", async () => {
      const raw: RawEvent = {
        source_type: "firewall",
        source_name: "pfsense-01",
        payload: { action: "block" },
      };

      const event = await normalizer.normalize(raw);
      expect(event.source.type).toBe("firewall");
      expect(event.source.name).toBe("pfsense-01");
    });

    it("uses provided timestamp", async () => {
      const timestamp = "2026-01-15T10:00:00.000Z";
      const raw: RawEvent = {
        source_type: "app",
        source_name: "test",
        timestamp,
        payload: { action: "test" },
      };

      const event = await normalizer.normalize(raw);
      expect(event.timestamp).toBe(timestamp);
    });

    it("stores original payload in metadata", async () => {
      const raw: RawEvent = {
        source_type: "app",
        source_name: "test",
        payload: { action: "test", custom_field: "value" },
      };

      const event = await normalizer.normalize(raw);
      expect(event.metadata).toEqual(raw.payload);
    });
  });
});
