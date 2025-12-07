import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
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

  pgm.createIndex("session", "expire");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("session");
}
