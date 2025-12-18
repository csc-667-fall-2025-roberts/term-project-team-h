import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("game_room_decks", "owner_player_id", "held_by_player_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("game_room_decks", "held_by_player_id", "owner_player_id");
}

