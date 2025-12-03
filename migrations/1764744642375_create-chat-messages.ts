import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("chat_messages", {
    id: "id",
    user_id: {
      type: "bigint",
      notNull: true,
      references: "users",
      onDelete: "CASCADE"
    },
    game_room_id: {
      type: "bigint",
      references: "game_rooms",
      onDelete: "CASCADE"
    },
    message: { type: "text", notNull: true },
    created_at: { type: "timestamp", default: pgm.func("current_timestamp") }
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("chat_messages");
}
