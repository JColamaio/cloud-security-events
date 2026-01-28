import { describe, it, expect } from "vitest";
import { MockGeoIpEnricher } from "../enrichers/geoip.js";

describe("MockGeoIpEnricher", () => {
  const enricher = new MockGeoIpEnricher();

  it("returns AR for argentine IP range", async () => {
    const geo = await enricher.lookup("190.100.50.25");
    expect(geo).toEqual({ country: "AR", city: "Buenos Aires" });
  });

  it("returns US for US IP range", async () => {
    const geo = await enricher.lookup("8.8.8.8");
    expect(geo).toEqual({ country: "US", city: "Los Angeles" });
  });

  it("returns undefined for private IP", async () => {
    const geo = await enricher.lookup("192.168.1.1");
    expect(geo).toBeUndefined();
  });

  it("returns undefined for localhost", async () => {
    const geo = await enricher.lookup("127.0.0.1");
    expect(geo).toBeUndefined();
  });

  it("returns undefined for unknown IP range", async () => {
    const geo = await enricher.lookup("1.1.1.1");
    expect(geo).toBeUndefined();
  });

  it("returns undefined for empty string", async () => {
    const geo = await enricher.lookup("");
    expect(geo).toBeUndefined();
  });
});
