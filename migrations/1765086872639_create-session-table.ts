import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create session table for connect-pg-simple
  // This matches the table structure required by connect-pg-simple
  pgm.createTable("session", {
    sid: {
      type: "varchar",
      primaryKey: true,
      notNull: true,
    },
    sess: {
      type: "json",
      notNull: true,
    },
    expire: {
      type: "timestamp",
      notNull: true,
    },
  });

  // Create index on expire for efficient cleanup of expired sessions
  pgm.createIndex("session", "expire");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("session");
}
