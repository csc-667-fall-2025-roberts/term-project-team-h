import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("game_room_players", "is_game_master", "is_host");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("game_room_players", "is_host", "is_game_master");
}

