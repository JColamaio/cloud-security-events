import Database from "better-sqlite3";
import type { EventStore, EventFilter } from "../interfaces/store.js";
import type { SecurityEvent } from "../types/events.js";

export class SQLiteStore implements EventStore {
  private db: Database.Database;

  constructor(dbPath: string = ":memory:") {
    this.db = new Database(dbPath);
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        ingested_at TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_action TEXT NOT NULL,
        event_severity TEXT NOT NULL,
        event_category TEXT NOT NULL,
        source TEXT NOT NULL,
        actor TEXT,
        target TEXT,
        outcome TEXT NOT NULL,
        metadata TEXT NOT NULL,
        pipeline TEXT NOT NULL
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_event_type ON events(event_type)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_timestamp ON events(timestamp)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_severity ON events(event_severity)
    `);
  }

  async save(event: SecurityEvent): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO events (
        id, timestamp, ingested_at, event_type, event_action,
        event_severity, event_category, source, actor, target,
        outcome, metadata, pipeline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.id,
      event.timestamp,
      event.ingested_at,
      event.event_type,
      event.event_action,
      event.event_severity,
      JSON.stringify(event.event_category),
      JSON.stringify(event.source),
      event.actor ? JSON.stringify(event.actor) : null,
      event.target ? JSON.stringify(event.target) : null,
      event.outcome,
      JSON.stringify(event.metadata),
      JSON.stringify(event.pipeline)
    );
  }

  async query(filter: EventFilter): Promise<SecurityEvent[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.event_type) {
      conditions.push("event_type = ?");
      params.push(filter.event_type);
    }
    if (filter.event_action) {
      conditions.push("event_action = ?");
      params.push(filter.event_action);
    }
    if (filter.severity) {
      conditions.push("event_severity = ?");
      params.push(filter.severity);
    }
    if (filter.from) {
      conditions.push("timestamp >= ?");
      params.push(filter.from);
    }
    if (filter.to) {
      conditions.push("timestamp <= ?");
      params.push(filter.to);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = filter.limit ?? 100;

    const sql = `SELECT * FROM events ${where} ORDER BY timestamp DESC LIMIT ?`;
    params.push(limit);

    const rows = this.db.prepare(sql).all(...params) as EventRow[];

    return rows.map((row) => this.rowToEvent(row));
  }

  async close(): Promise<void> {
    this.db.close();
  }

  private rowToEvent(row: EventRow): SecurityEvent {
    return {
      id: row.id,
      timestamp: row.timestamp,
      ingested_at: row.ingested_at,
      event_type: row.event_type as SecurityEvent["event_type"],
      event_action: row.event_action,
      event_severity: row.event_severity as SecurityEvent["event_severity"],
      event_category: JSON.parse(row.event_category),
      source: JSON.parse(row.source),
      actor: row.actor ? JSON.parse(row.actor) : undefined,
      target: row.target ? JSON.parse(row.target) : undefined,
      outcome: row.outcome as SecurityEvent["outcome"],
      metadata: JSON.parse(row.metadata),
      pipeline: JSON.parse(row.pipeline),
    };
  }
}

interface EventRow {
  id: string;
  timestamp: string;
  ingested_at: string;
  event_type: string;
  event_action: string;
  event_severity: string;
  event_category: string;
  source: string;
  actor: string | null;
  target: string | null;
  outcome: string;
  metadata: string;
  pipeline: string;
}
