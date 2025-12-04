import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("game_room_players", {
    id: "id" as any,
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
    is_game_master: { type: "boolean", default: false } as any,
    player_order: "int" as any,
    cards_in_hand: { type: "int", default: 0 } as any,
    joined_at: { type: "timestamp", default: pgm.func("current_timestamp") } as any
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("game_room_players");
}
