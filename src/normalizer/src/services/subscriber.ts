import type { MessageQueue, RawEvent } from "@cse/shared";

const RAW_EVENTS_SUBSCRIPTION = process.env["RAW_EVENTS_SUBSCRIPTION"] ?? "raw-events-sub";

export class EventSubscriber {
  constructor(private queue: MessageQueue) {}

  start(handler: (event: RawEvent) => Promise<void>): void {
    this.queue.subscribe<RawEvent>(RAW_EVENTS_SUBSCRIPTION, handler);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
