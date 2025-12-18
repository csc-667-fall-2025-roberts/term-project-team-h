import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("game_rooms", {
    turn_direction: { type: "int", notNull: true, default: 1 } as any
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("game_rooms", "turn_direction");
}
