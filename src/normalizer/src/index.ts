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

  const typeParam = req.query["type"];
  if (typeof typeParam === "string") {
    filter.event_type = typeParam;
  }

  const severityParam = req.query["severity"];
  if (typeof severityParam === "string") {
    filter.severity = severityParam;
  }

  const events = await store.query(filter);
  res.json(events);
});

function start() {
  subscriber.start(async (rawEvent) => {
    const securityEvent = await normalizer.normalize(rawEvent);
    await store.save(securityEvent);
    await publisher.publish(securityEvent);

    const enrichmentParts: string[] = [];
    if (securityEvent.pipeline.enrichments_applied.includes("geoip") && securityEvent.actor?.geo) {
      const ip = securityEvent.actor.ip ?? "unknown";
      const country = securityEvent.actor.geo.country ?? "unknown";
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

function shutdown() {
  console.log("Shutting down normalizer service...");
  store.close().catch(console.error);
  subscriber.close().catch(console.error);
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

start();
