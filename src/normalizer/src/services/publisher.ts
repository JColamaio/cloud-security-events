import type { MessageQueue, SecurityEvent } from "@cse/shared";

const PROCESSED_EVENTS_TOPIC = process.env["PROCESSED_EVENTS_TOPIC"] ?? "processed-events";

export class ProcessedEventPublisher {
  constructor(private queue: MessageQueue) {}

  async publish(event: SecurityEvent): Promise<void> {
    await this.queue.publish(PROCESSED_EVENTS_TOPIC, event);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
