/**
 * SQL queries for chat functionality
 */

export const chatQueries = {
  // Chat message operations
  findByGameRoom: `
    SELECT cm.*, u.username
    FROM chat_messages cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.game_room_id = $1
    ORDER BY cm.created_at ASC
  `,
  create: `
    INSERT INTO chat_messages (user_id, game_room_id, message)
    VALUES ($1, $2, $3)
    RETURNING *
  `,
};

