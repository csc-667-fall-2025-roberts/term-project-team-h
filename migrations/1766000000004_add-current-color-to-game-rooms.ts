import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("game_rooms", {
    current_color: { type: "card_color_enum", notNull: false } as any
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("game_rooms", "current_color");
}

