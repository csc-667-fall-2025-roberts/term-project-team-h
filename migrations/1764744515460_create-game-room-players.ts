import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("game_room_players", {
    id: "id",
    user_id: {
      type: "bigint",
      notNull: true,
      references: "users",
      onDelete: "CASCADE"
    },
    game_room_id: {
      type: "bigint",
      notNull: true,
      references: "game_rooms",
      onDelete: "CASCADE"
    },
    is_game_master: { type: "boolean", default: false },
    player_order: "int",
    cards_in_hand: { type: "int", default: 0 },
    joined_at: { type: "timestamp", default: pgm.func("current_timestamp") }
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("game_room_players");
}
