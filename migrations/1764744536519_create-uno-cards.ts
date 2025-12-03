import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("uno_cards", {
    id: "id",
    color: { type: "card_color_enum", notNull: true },
    value: { type: "card_value_enum", notNull: true }
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("uno_cards");
}
