/**
 * SQL queries for waiting room (room + players)
 */

export const waitingRoomQueries = {
  /**
   * Get a single room with host username.
   */
  findRoomWithHost: `
    SELECT
      gr.id,
      gr.title,
      gr.status,
      gr.max_players AS "maxPlayers",
      gr.password,
      gr.created_by AS "createdBy",
      gr.created_at AS "createdAt",
      gr.started_at AS "startedAt",
      gr.ended_at AS "endedAt",
      u.username AS "hostUsername"
    FROM game_rooms gr
    JOIN users u
      ON u.id = gr.created_by
    WHERE gr.id = $1
  `,

  /**
   * List all players currently in the room, with usernames.
   */
  listPlayersInRoom: `
    SELECT
      p.id,
      p.user_id AS "userId",
      p.game_room_id AS "gameRoomId",
      p.is_game_master AS "isGameMaster",
      p.player_order AS "playerOrder",
      p.cards_in_hand AS "cardsInHand",
      p.joined_at AS "joinedAt",
      u.username
    FROM game_room_players p
    JOIN users u
      ON u.id = p.user_id
    WHERE p.game_room_id = $1
    ORDER BY
      p.player_order ASC NULLS LAST,
      p.joined_at ASC
  `,

  /**
   * Check if a given user is already in the room.
   */
  findPlayerInRoom: `
    SELECT
      id,
      user_id AS "userId",
      game_room_id AS "gameRoomId",
      is_game_master AS "isGameMaster",
      player_order AS "playerOrder",
      cards_in_hand AS "cardsInHand",
      joined_at AS "joinedAt"
    FROM game_room_players
    WHERE game_room_id = $1
      AND user_id = $2
  `,

  /**
   * Count players in a room (for capacity / ordering).
   */
  countPlayersInRoom: `
    SELECT COUNT(*)::int AS "playerCount"
    FROM game_room_players
    WHERE game_room_id = $1
  `,

  /**
   * Add a player to the room (used by join logic).
   * You normally supply player_order based on countPlayersInRoom.
   */
  addPlayerToRoom: `
    INSERT INTO game_room_players (
      user_id,
      game_room_id,
      is_game_master,
      player_order,
      cards_in_hand,
      joined_at
    )
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING
      id,
      user_id AS "userId",
      game_room_id AS "gameRoomId",
      is_game_master AS "isGameMaster",
      player_order AS "playerOrder",
      cards_in_hand AS "cardsInHand",
      joined_at AS "joinedAt"
  `,

  /**
   * Update the room password (for "Set Room Password" in waiting room).
   */
  updateRoomPassword: `
    UPDATE game_rooms
    SET password = $2
    WHERE id = $1
    RETURNING
      id,
      title,
      status,
      max_players AS "maxPlayers",
      password,
      created_by AS "createdBy",
      created_at AS "createdAt",
      started_at AS "startedAt",
      ended_at AS "EndedAt"
  `,
};