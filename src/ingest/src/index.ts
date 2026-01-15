import express from "express";
import { RawEventSchema } from "@cse/shared";

const app = express();
const port = process.env["PORT"] ?? 3000;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/events", (req, res) => {
  const result = RawEventSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  // TODO: publish to queue
  console.log("received event:", result.data.source_name);

  res.status(202).json({ accepted: true });
});

app.listen(port, () => {
  console.log(`ingest service listening on port ${String(port)}`);
});
