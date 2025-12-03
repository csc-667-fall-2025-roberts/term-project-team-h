import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("game_rooms", {
    id: "id",
    title: "varchar(100)",
    max_players: { type: "int", notNull: true, default: 4 },
    password: "varchar(100)",
    status: { type: "game_status_enum", notNull: true, default: "'waiting'" },
    created_by: {
      type: "bigint",
      notNull: true,
      references: "users",
      onDelete: "CASCADE"
    },
    created_at: { type: "timestamp", default: pgm.func("current_timestamp") },
    started_at: "timestamp",
    ended_at: "timestamp"
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("game_rooms");
}
