import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { PubSubEmulatorQueue } from "@cse/shared";
import { RuleLoader } from "./engine/rule-loader.js";
import { AlertEngine } from "./services/alert-engine.js";
import { ProcessedEventSubscriber } from "./services/subscriber.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env["PORT"] ?? 3002;
const rulesDir = process.env["RULES_DIR"] ?? join(__dirname, "rules");

const queue = new PubSubEmulatorQueue();
const subscriber = new ProcessedEventSubscriber(queue);

const loader = new RuleLoader(rulesDir);
const rules = loader.load();
const engine = new AlertEngine(rules);

console.log(`Loaded ${String(rules.length)} detection rules`);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/rules", (_req, res) => {
  res.json(engine.getRules());
});

function start() {
  subscriber.start(async (event) => {
    const alerts = await engine.process(event);

    if (alerts.length === 0) {
      console.log(`Event ${event.id} (${event.event_type}) - no alerts`);
    }
  });

  app.listen(port, () => {
    console.log(`alerting service listening on port ${String(port)}`);
  });
}

function shutdown() {
  console.log("Shutting down alerting service...");
  engine.close();
  subscriber.close().catch(console.error);
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

start();
