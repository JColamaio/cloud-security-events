import express from "express";
import { RawEventSchema, PubSubEmulatorQueue } from "@cse/shared";
import { EventPublisher } from "./services/publisher.js";

const app = express();
const port = process.env["PORT"] ?? 3000;

const queue = new PubSubEmulatorQueue();
const publisher = new EventPublisher(queue);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/events", async (req, res) => {
  const result = RawEventSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  await publisher.publish(result.data);

  res.status(202).json({ accepted: true });
});

app.listen(port, () => {
  console.log(`ingest service listening on port ${String(port)}`);
});
