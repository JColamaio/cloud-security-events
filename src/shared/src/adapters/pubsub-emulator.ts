import { PubSub, type Message } from "@google-cloud/pubsub";
import type { MessageQueue, MessageHandler } from "../interfaces/queue.js";

export class PubSubEmulatorQueue implements MessageQueue {
  private client: PubSub;

  constructor(projectId = "local-project") {
    this.client = new PubSub({ projectId });
  }

  async publish(topic: string, message: unknown): Promise<void> {
    const topicRef = this.client.topic(topic);
    const data = Buffer.from(JSON.stringify(message));
    await topicRef.publishMessage({ data });
  }

  subscribe<T = unknown>(subscription: string, handler: MessageHandler<T>): void {
    const sub = this.client.subscription(subscription);

    sub.on("message", (message: Message) => {
      const data = JSON.parse(message.data.toString()) as T;
      handler(data)
        .then(() => {
          message.ack();
        })
        .catch(() => {
          message.nack();
        });
    });
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
