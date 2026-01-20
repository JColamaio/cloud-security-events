import { z } from "zod";

export const GeoLocationSchema = z.object({
  country: z.string().optional(),
  city: z.string().optional(),
});

export const EventSourceSchema = z.object({
  type: z.string(),
  name: z.string(),
  ip: z.string().optional(),
  hostname: z.string().optional(),
});

export const EventActorSchema = z.object({
  user: z.string().optional(),
  email: z.string().email().optional(),
  ip: z.string().optional(),
  geo: GeoLocationSchema.optional(),
});

export const EventTargetSchema = z.object({
  type: z.string(),
  name: z.string().optional(),
  ip: z.string().optional(),
  port: z.number().int().positive().optional(),
});

export const PipelineMetadataSchema = z.object({
  version: z.string(),
  processed_at: z.string().datetime(),
  enrichments_applied: z.array(z.string()),
});

export const SecurityEventSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  ingested_at: z.string().datetime(),

  event_type: z.enum(["authentication", "network", "file", "process", "audit"]),
  event_action: z.string(),
  event_severity: z.enum(["low", "medium", "high", "critical"]),
  event_category: z.array(z.string()),

  source: EventSourceSchema,
  actor: EventActorSchema.optional(),
  target: EventTargetSchema.optional(),

  outcome: z.enum(["success", "failure", "unknown"]),
  metadata: z.record(z.unknown()),
  pipeline: PipelineMetadataSchema,
});

export const RawEventSchema = z.object({
  source_type: z.string(),
  source_name: z.string(),
  timestamp: z.string().datetime().optional(),
  payload: z.record(z.unknown()),
});

export type RawEventInput = z.infer<typeof RawEventSchema>;
