import type { MessageQueue, SecurityEvent } from "@cse/shared";

const PROCESSED_EVENTS_SUBSCRIPTION =
  process.env["PROCESSED_EVENTS_SUBSCRIPTION"] ?? "processed-events-sub";

export class ProcessedEventSubscriber {
  constructor(private queue: MessageQueue) {}

  start(handler: (event: SecurityEvent) => Promise<void>): void {
    this.queue.subscribe<SecurityEvent>(PROCESSED_EVENTS_SUBSCRIPTION, handler);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
