/**
 * SQL queries for game functionality
 */

export const gameRoomQueries = {
  findById: "SELECT * FROM game_rooms WHERE id = $1",
  findByStatus: "SELECT * FROM game_rooms WHERE status = $1 ORDER BY created_at DESC",
  findByCreator: "SELECT * FROM game_rooms WHERE created_by = $1 ORDER BY created_at DESC",
  create: `
    INSERT INTO game_rooms (title, max_players, password, status, created_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `,
  update: `
    UPDATE game_rooms
    SET title = COALESCE($1, title),
        max_players = COALESCE($2, max_players),
        password = COALESCE($3, password),
        status = COALESCE($4, status),
        started_at = COALESCE($5, started_at),
        ended_at = COALESCE($6, ended_at),
        turn_direction = COALESCE($7, turn_direction)
    WHERE id = $8
    RETURNING *
  `,
  delete: "DELETE FROM game_rooms WHERE id = $1",
  list: "SELECT * FROM game_rooms ORDER BY created_at DESC",
};

export const gameRoomPlayerQueries = {
  findById: "SELECT * FROM game_room_players WHERE id = $1",
  findByGameRoom: `
    SELECT grp.*, u.username
    FROM game_room_players grp
    JOIN users u ON grp.user_id = u.id
    WHERE grp.game_room_id = $1
    ORDER BY grp.player_order ASC
  `,
  findByUser: "SELECT * FROM game_room_players WHERE user_id = $1",
  findByGameRoomAndUser: `
    SELECT * FROM game_room_players
    WHERE game_room_id = $1 AND user_id = $2
  `,
  create: `
    INSERT INTO game_room_players (user_id, game_room_id, is_game_master, player_order)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `,
  update: `
    UPDATE game_room_players
    SET is_game_master = COALESCE($1, is_game_master),
        player_order = COALESCE($2, player_order),
        cards_in_hand = COALESCE($3, cards_in_hand)
    WHERE id = $4
    RETURNING *
  `,
  delete: "DELETE FROM game_room_players WHERE id = $1",
  deleteByGameRoom: "DELETE FROM game_room_players WHERE game_room_id = $1",
};

export const unoCardQueries = {
  findById: "SELECT * FROM uno_cards WHERE id = $1",
  findByColor: "SELECT * FROM uno_cards WHERE color = $1",
  findByValue: "SELECT * FROM uno_cards WHERE value = $1",
  list: "SELECT * FROM uno_cards ORDER BY color, value",
};

export const gameRoomDeckQueries = {
  findById: "SELECT * FROM game_room_decks WHERE id = $1",
  findByGameRoom: "SELECT * FROM game_room_decks WHERE game_room_id = $1",
  findByLocation: `
    SELECT grd.*, uc.color, uc.value
    FROM game_room_decks grd
    JOIN uno_cards uc ON grd.card_id = uc.id
    WHERE grd.game_room_id = $1
      AND grd.location = $2
    ORDER BY grd.position_index ASC
  `,
  findByPlayer: `
    SELECT grd.*, uc.color, uc.value
    FROM game_room_decks grd
    JOIN uno_cards uc ON grd.card_id = uc.id
    WHERE grd.game_room_id = $1
      AND grd.owner_player_id = $2
      AND grd.location = 'player_hand'
    ORDER BY grd.position_index ASC
  `,
  create: `
    INSERT INTO game_room_decks (game_room_id, card_id, location, owner_player_id, position_index)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `,
  update: `
    UPDATE game_room_decks
    SET location = COALESCE($1, location),
        owner_player_id = COALESCE($2, owner_player_id),
        position_index = COALESCE($3, position_index)
    WHERE id = $4
    RETURNING *
  `,
  delete: "DELETE FROM game_room_decks WHERE id = $1",
  deleteByGameRoom: "DELETE FROM game_room_decks WHERE game_room_id = $1",
  
  /**
   *  Validates card ownership
   */
  canPlayCard:`
    SELECT grd.*
    FROM game_room_decks grd
    WHERE grd.id = $1
      AND grd.game_room_id = $2
      AND grd.owner_player_id = $3
      AND grd.location = 'player_hand'
  `,
  /**
   *  Moves a card to the discard pile
   */

  moveCardToDiscard:`
    UPDATE game_room_decks
    SET location = 'discard',
      owner_player_id = NULL,
      position_index = $2
    WHERE id = $1
    RETURNING *
  `,

  /**
   *  Used for validating if a play is legal by comparing the card
   *  to the top discarded card
   */

  getTopDiscard:`
    SELECT grd.*, uc.color, uc.value
    FROM game_room_decks grd
    JOIN uno_cards uc ON grd.card_id = uc.id
    WHERE grd.game_room_id = $1
      AND grd.location = 'discard'
    ORDER BY grd.position_index DESC
    LIMIT 1
  `,

  /**
   *  Used for drawing a card from the deck
   */

  getTopDeckCard:`
    SELECT *
    FROM game_room_decks
    WHERE game_room_id = $1
      AND location = 'deck'
    ORDER BY position_index ASC
    LIMIT 1
  `,

  moveCardToPlayerHand:`
    UPDATE game_room_decks
    SET location = 'player_hand',
      owner_player_id = $2,
      position_index = $3
    WHERE id = $1
    RETURNING *
  `,

  /**
   *  increments the number of cards in hand
   */

  incrementPlayerHandCount:`
    UPDATE game_room_players
    SET cards_in_hand = cards_in_hand + 1
    WHERE id = $1
    RETURNING *
  `,

  decrementPlayerHandCount: `
    UPDATE game_room_players
    SET cards_in_hand = cards_in_hand - 1
    WHERE id = $1
    RETURNING *
  `,

};

export const gameTurnQueries = {
  findById: "SELECT * FROM game_turns WHERE id = $1",
  findByGameRoom: `
    SELECT gt.*, u.username
    FROM game_turns gt
    JOIN game_room_players grp ON gt.player_id = grp.id
    JOIN users u ON grp.user_id = u.id
    WHERE gt.game_room_id = $1
    ORDER BY gt.created_at ASC
  `,
  create: `
    INSERT INTO game_turns (game_room_id, player_id, card_played_id, action_type)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `,
  getLatest: `
    SELECT * FROM game_turns
    WHERE game_room_id = $1
    ORDER BY created_at DESC
    LIMIT 1
  `,
  delete: "DELETE FROM game_turns WHERE id = $1",
  deleteByGameRoom: "DELETE FROM game_turns WHERE game_room_id = $1",
};

export const gameResultQueries = {
  findById: "SELECT * FROM game_results WHERE id = $1",
  findByGameRoom: "SELECT * FROM game_results WHERE game_room_id = $1",
  create: `
    INSERT INTO game_results (game_room_id, winner_id, total_turns)
    VALUES ($1, $2, $3)
    RETURNING *
  `,
  delete: "DELETE FROM game_results WHERE id = $1",
};

export const gameResultPlayerQueries = {
  findById: "SELECT * FROM game_result_players WHERE id = $1",
  findByGameResult: `
    SELECT grp.*, u.username
    FROM game_result_players grp
    JOIN users u ON grp.user_id = u.id
    WHERE grp.game_result_id = $1
    ORDER BY grp.rank ASC
  `,
  create: `
    INSERT INTO game_result_players (game_result_id, user_id, rank, cards_left)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `,
  delete: "DELETE FROM game_result_players WHERE id = $1",
  deleteByGameResult: "DELETE FROM game_result_players WHERE game_result_id = $1",
};

