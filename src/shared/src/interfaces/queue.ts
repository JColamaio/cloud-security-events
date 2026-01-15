export type MessageHandler<T = unknown> = (message: T) => Promise<void>;

export interface MessageQueue {
  publish(topic: string, message: unknown): Promise<void>;
  subscribe<T = unknown>(subscription: string, handler: MessageHandler<T>): Promise<void>;
  close(): Promise<void>;
}
