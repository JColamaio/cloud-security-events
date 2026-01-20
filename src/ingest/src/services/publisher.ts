import type { MessageQueue, RawEventInput } from "@cse/shared";

const RAW_EVENTS_TOPIC = process.env["RAW_EVENTS_TOPIC"] ?? "raw-events";

export class EventPublisher {
  constructor(private queue: MessageQueue) {}

  async publish(event: RawEventInput): Promise<void> {
    await this.queue.publish(RAW_EVENTS_TOPIC, event);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
