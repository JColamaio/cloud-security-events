import type { SecurityEvent } from "@cse/shared";
import type { AggregationCondition } from "../types/rules.js";

interface AggregationBucket {
  count: number;
  firstSeen: number;
  lastSeen: number;
}

interface AggregationKey {
  ruleId: string;
  fieldValue: string;
}

export interface AggregationResult {
  triggered: boolean;
  count: number;
}

export class EventAggregator {
  private buckets = new Map<string, AggregationBucket>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60_000);
  }

  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, bucket] of this.buckets) {
      const maxAge = 10 * 60 * 1000;
      if (now - bucket.lastSeen > maxAge) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.buckets.delete(key);
    }
  }

  private makeKey(key: AggregationKey): string {
    return `${key.ruleId}:${key.fieldValue}`;
  }

  private getFieldValue(event: SecurityEvent, field: string): string | null {
    const parts = field.split(".");
    let current: unknown = event;

    for (const part of parts) {
      if (current === null || current === undefined) return null;
      current = (current as Record<string, unknown>)[part];
    }

    if (current === null || current === undefined) return null;
    if (typeof current === "object") return JSON.stringify(current);
    if (typeof current === "string") return current;
    if (typeof current === "number" || typeof current === "boolean") {
      return current.toString();
    }
    return null;
  }

  track(ruleId: string, event: SecurityEvent, condition: AggregationCondition): AggregationResult {
    const fieldValue = this.getFieldValue(event, condition.field);

    if (!fieldValue) {
      return { triggered: false, count: 0 };
    }

    const key = this.makeKey({ ruleId, fieldValue });
    const now = Date.now();
    const windowMs = condition.time_window_seconds * 1000;

    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = {
        count: 0,
        firstSeen: now,
        lastSeen: now,
      };
      this.buckets.set(key, bucket);
    }

    if (now - bucket.firstSeen > windowMs) {
      bucket.count = 0;
      bucket.firstSeen = now;
    }

    bucket.count++;
    bucket.lastSeen = now;

    const triggered = bucket.count >= condition.count_threshold;

    if (triggered) {
      const count = bucket.count;
      bucket.count = 0;
      bucket.firstSeen = now;
      return { triggered: true, count };
    }

    return { triggered: false, count: bucket.count };
  }

  close(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
