import { DatabaseSync } from "node:sqlite";

export class AuditRepository {
  private readonly database: DatabaseSync;

  constructor(database: DatabaseSync) {
    this.database = database;
  }

  append(actorUserId: string | null, action: string, entityId: string, createdAt: string, entityType = "user") {
    this.database.prepare("INSERT INTO audit_log (actorUserId, action, entityType, entityId, createdAt) VALUES (?, ?, ?, ?, ?)")
      .run(actorUserId, action, entityType, entityId, createdAt);
  }
}
