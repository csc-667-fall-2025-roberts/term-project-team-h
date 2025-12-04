import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // game_room_decks
  pgm.createTable("game_room_decks", {
    id: "id" as any,
    game_room_id: {
      type: "bigint",
      notNull: true,
      references: "game_rooms",
      onDelete: "CASCADE"
    },
    card_id: {
      type: "bigint",
      notNull: true,
      references: "uno_cards",
      onDelete: "CASCADE"
    },
    location: { type: "card_location_enum", notNull: true },
    owner_player_id: {
      type: "bigint",
      references: "game_room_players",
      onDelete: "CASCADE"
    },
    position_index: "int" as any
  });

  // game_turns
  pgm.createTable("game_turns", {
    id: "id" as any,
    game_room_id: {
      type: "bigint",
      notNull: true,
      references: "game_rooms",
      onDelete: "CASCADE"
    },
    player_id: {
      type: "bigint",
      notNull: true,
      references: "game_room_players",
      onDelete: "CASCADE"
    },
    card_played_id: {
      type: "bigint",
      references: "uno_cards",
      onDelete: "SET NULL"
    },
    action_type: { type: "action_type_enum", notNull: true },
    created_at: { type: "timestamp", default: pgm.func("current_timestamp") } as any
  });

  // game_results
  pgm.createTable("game_results", {
    id: "id" as any,
    game_room_id: {
      type: "bigint",
      notNull: true,
      references: "game_rooms",
      onDelete: "CASCADE"
    },
    winner_id: {
      type: "bigint",
      references: "users",
      onDelete: "SET NULL"
    },
    total_turns: "int" as any,
    created_at: { type: "timestamp", default: pgm.func("current_timestamp") } as any
  });

  // game_result_players
  pgm.createTable("game_result_players", {
    id: "id" as any,
    game_result_id: {
      type: "bigint",
      notNull: true,
      references: "game_results",
      onDelete: "CASCADE"
    },
    user_id: {
      type: "bigint",
      notNull: true,
      references: "users",
      onDelete: "CASCADE"
    },
    rank: { type: "int", notNull: true },
    cards_left: { type: "int", default: 0 } as any
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("game_result_players");
  pgm.dropTable("game_results");
  pgm.dropTable("game_turns");
  pgm.dropTable("game_room_decks");
}
