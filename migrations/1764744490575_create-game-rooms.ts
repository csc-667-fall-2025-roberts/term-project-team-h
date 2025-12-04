import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("game_rooms", {
    id: "id" as any,
    title: { type: "varchar(100)" },
    max_players: { type: "int", notNull: true, default: 4 } as any,
    password: { type: "varchar(100)" },
    status: { type: "game_status_enum", notNull: true, default: "waiting" } as any,
    created_by: {
      type: "bigint",
      notNull: true,
      references: "users",
      onDelete: "CASCADE"
    },
    created_at: { type: "timestamp", default: pgm.func("current_timestamp") } as any,
    started_at: { type: "timestamp" },
    ended_at: { type: "timestamp" }
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("game_rooms");
}
