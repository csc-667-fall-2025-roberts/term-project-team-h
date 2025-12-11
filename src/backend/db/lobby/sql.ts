/**
 * SQL queries for game rooms and lobby
 */

export const gameRoomQueries = {
  /**
   * List all lobby rooms (waiting status) with:
   * - host username
   * - current player count
   * - password flag
   */
  lobbyList: `
    SELECT
      gr.id,
      gr.title,
      gr.status,
      gr.max_players AS "maxPlayers",
      gr.created_at AS "createdAt",
      u.username AS "hostUsername",
      COALESCE(COUNT(p.id), 0)::int AS "currentPlayers",
      (gr.password IS NOT NULL AND gr.password <> '') AS "hasPassword"
    FROM game_rooms gr
    JOIN users u
      ON u.id = gr.created_by
    LEFT JOIN game_room_players p
      ON p.game_room_id = gr.id
    WHERE gr.status = 'waiting'
    GROUP BY
      gr.id,
      gr.title,
      gr.status,
      gr.max_players,
      gr.created_at,
      u.username,
      gr.password
    ORDER BY gr.created_at DESC
  `,

  /**
   * Create a new game room
   */
  createRoom: `
    INSERT INTO game_rooms (
      title,
      max_players,
      password,
      status,
      created_by
    )
    VALUES ($1, $2, $3, 'waiting', $4)
    RETURNING
      id,
      title,
      status,
      max_players AS "maxPlayers",
      created_at AS "createdAt"
  `,

  /**
   * Insert a player into a room.
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
    RETURNING id
  `,

  /**
   * Count how many players are in a room.
   */
  countPlayersInRoom: `
    SELECT COUNT(*)::int AS "playerCount"
    FROM game_room_players
    WHERE game_room_id = $1
  `,

  /**
   * Check if a user is already in a specific room.
   */
  findPlayerInRoom: `
    SELECT id
    FROM game_room_players
    WHERE game_room_id = $1 AND user_id = $2
  `,

  /**
   * Find a single game room by id
   */
  findRoomById: `
    SELECT
      id,
      title,
      status,
      max_players AS "maxPlayers",
      password,
      created_by AS "createdBy",
      created_at AS "createdAt",
      started_at AS "startedAt",
      ended_at AS "endedAt"
    FROM game_rooms
    WHERE id = $1
  `,
};
