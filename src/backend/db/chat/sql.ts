/**
 * SQL queries for chat functionality
 */

export const chatQueries = {
  // Chat message operations
  findById: "SELECT * FROM chat_messages WHERE id = $1",
  findByGameRoom: `
    SELECT cm.*, u.username
    FROM chat_messages cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.game_room_id = $1
    ORDER BY cm.created_at ASC
  `,
  findByUser: "SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY created_at DESC",
  create: `
    INSERT INTO chat_messages (user_id, game_room_id, message)
    VALUES ($1, $2, $3)
    RETURNING *
  `,
  update: `
    UPDATE chat_messages
    SET message = $1
    WHERE id = $2
    RETURNING *
  `,
  delete: "DELETE FROM chat_messages WHERE id = $1",
  deleteByGameRoom: "DELETE FROM chat_messages WHERE game_room_id = $1",
  recentMessages: `
    SELECT cm.*, u.username
    FROM chat_messages cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.game_room_id = $1
    ORDER BY cm.created_at DESC
    LIMIT $2
  `,
};

