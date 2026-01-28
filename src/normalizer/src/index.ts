import express from "express";
import { PubSubEmulatorQueue } from "@cse/shared";
import { EventSubscriber } from "./services/subscriber.js";
import { EventNormalizer } from "./services/normalizer.js";
import { ProcessedEventPublisher } from "./services/publisher.js";
import { MockGeoIpEnricher } from "./enrichers/geoip.js";

const app = express();
const port = process.env["PORT"] ?? 3001;

const subscriberQueue = new PubSubEmulatorQueue();
const publisherQueue = new PubSubEmulatorQueue();

const subscriber = new EventSubscriber(subscriberQueue);
const geoIpEnricher = new MockGeoIpEnricher();
const normalizer = new EventNormalizer({ geoIpEnricher });
const publisher = new ProcessedEventPublisher(publisherQueue);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

async function start() {
  await subscriber.start(async (rawEvent) => {
    const securityEvent = await normalizer.normalize(rawEvent);
    await publisher.publish(securityEvent);

    const enrichments = securityEvent.pipeline.enrichments_applied;
    const enrichmentInfo = enrichments.length > 0 ? ` [${enrichments.join(", ")}]` : "";
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
