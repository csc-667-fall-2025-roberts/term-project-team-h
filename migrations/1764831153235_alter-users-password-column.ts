import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("users", "password", {
    type: "varchar(60)",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("users", "password", {
    type: "varchar(255)",
  });
}
