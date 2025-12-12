import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  
  const colors = ["red", "blue", "green", "yellow"];
  const numberValues = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const actionValues = ["skip", "reverse", "draw_two"];
  
  for (const color of colors) {
    pgm.sql(`INSERT INTO uno_cards (color, value) VALUES ('${color}', '0')`);
    
    for (const value of numberValues.slice(1)) {
      pgm.sql(`INSERT INTO uno_cards (color, value) VALUES ('${color}', '${value}')`);
      pgm.sql(`INSERT INTO uno_cards (color, value) VALUES ('${color}', '${value}')`);
    }
    
    for (const value of actionValues) {
      pgm.sql(`INSERT INTO uno_cards (color, value) VALUES ('${color}', '${value}')`);
      pgm.sql(`INSERT INTO uno_cards (color, value) VALUES ('${color}', '${value}')`);
    }
  }
  
  for (let i = 0; i < 4; i++) {
    pgm.sql(`INSERT INTO uno_cards (color, value) VALUES ('wild', 'wild')`);
    pgm.sql(`INSERT INTO uno_cards (color, value) VALUES ('wild', 'wild_draw_four')`);
  }
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql("DELETE FROM uno_cards");
}

