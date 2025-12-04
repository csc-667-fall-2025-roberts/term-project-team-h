import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType("game_status_enum", ["waiting", "in_progress", "finished"]);

  pgm.createType("card_color_enum", ["red", "blue", "green", "yellow", "wild"]);

  pgm.createType("card_value_enum", [
    "0","1","2","3","4","5","6","7","8","9",
    "skip","reverse","draw_two","wild","wild_draw_four"
  ]);

  pgm.createType("card_location_enum", ["deck", "discard", "player_hand"]);

  pgm.createType("action_type_enum", ["play","draw","skip","reverse","draw_two","wild"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropType("action_type_enum");
  pgm.dropType("card_location_enum");
  pgm.dropType("card_value_enum");
  pgm.dropType("card_color_enum");
  pgm.dropType("game_status_enum");
}
