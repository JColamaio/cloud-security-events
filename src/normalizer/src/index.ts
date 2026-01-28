import express from "express";
import { PubSubEmulatorQueue, SQLiteStore } from "@cse/shared";
import { EventSubscriber } from "./services/subscriber.js";
import { EventNormalizer } from "./services/normalizer.js";
import { ProcessedEventPublisher } from "./services/publisher.js";
import { MockGeoIpEnricher } from "./enrichers/geoip.js";

const app = express();
const port = process.env["PORT"] ?? 3001;

const subscriberQueue = new PubSubEmulatorQueue();
const publisherQueue = new PubSubEmulatorQueue();
const dbPath = process.env["SQLITE_DB_PATH"] ?? "/data/events.db";
const store = new SQLiteStore(dbPath);

const subscriber = new EventSubscriber(subscriberQueue);
const geoIpEnricher = new MockGeoIpEnricher();
const normalizer = new EventNormalizer({ geoIpEnricher });
const publisher = new ProcessedEventPublisher(publisherQueue);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/events", async (req, res) => {
  const filter: Parameters<typeof store.query>[0] = {
    limit: req.query["limit"] ? Number(req.query["limit"]) : 50,
  };

  if (req.query["type"]) {
    filter.event_type = req.query["type"] as string;
  }
  if (req.query["severity"]) {
    filter.severity = req.query["severity"] as string;
  }

  const events = await store.query(filter);
  res.json(events);
});

async function start() {
  await subscriber.start(async (rawEvent) => {
    const securityEvent = await normalizer.normalize(rawEvent);
    await store.save(securityEvent);
    await publisher.publish(securityEvent);

    const enrichmentParts: string[] = [];
    if (securityEvent.pipeline.enrichments_applied.includes("geoip") && securityEvent.actor?.geo) {
      const { ip } = securityEvent.actor;
      const { country } = securityEvent.actor.geo;
      enrichmentParts.push(`geoip: ${ip} -> ${country}`);
    }

    const enrichmentInfo = enrichmentParts.length > 0 ? ` [${enrichmentParts.join(", ")}]` : "";
    console.log(
      `Processed event ${securityEvent.id} (${securityEvent.event_type})${enrichmentInfo}`
    );
  });

  app.listen(port, () => {
    console.log(`normalizer service listening on port ${String(port)}`);
  });
}

start().catch((err) => {
  console.error("Failed to start normalizer:", err);
  process.exit(1);
});
