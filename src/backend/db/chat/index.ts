/**
 * Chat database operations
 */

import db from "../connection";
import { chatQueries } from "./sql";

export interface ChatMessage {
  id: number;
  user_id: number;
  game_room_id: number | null;
  message: string;
  created_at: Date;
}

export interface ChatMessageWithUsername extends ChatMessage {
  username: string;
}

export interface CreateChatMessageData {
  user_id: number;
  game_room_id: number | null;
  message: string;
}

/**
 * Find all chat messages for a game room
 */
export async function findChatMessagesByGameRoom(
  gameRoomId: number
): Promise<ChatMessageWithUsername[]> {
  const messages = await db.manyOrNone<ChatMessageWithUsername>(
    chatQueries.findByGameRoom,
    [gameRoomId]
  );
  return messages || [];
}

/**
 * Create a new chat message
 */
export async function createChatMessage(data: CreateChatMessageData): Promise<ChatMessage> {
  const message = await db.one<ChatMessage>(
    chatQueries.create,
    [data.user_id, data.game_room_id, data.message]
  );
  return message;
}

/**
 * List all messages for global lobby (where game_room_id is null)
 */
export async function list(): Promise<ChatMessageWithUsername[]> {
  const messages = await db.manyOrNone<ChatMessageWithUsername>(
    `SELECT cm.*, u.username
     FROM chat_messages cm
     JOIN users u ON cm.user_id = u.id
     WHERE cm.game_room_id IS NULL
     ORDER BY cm.created_at ASC`
  );
  return messages || [];
}

/**
 * Create a message for global lobby
 */
export async function create(
  userId: number,
  message: string
): Promise<ChatMessageWithUsername> {
  const savedMessage = await createChatMessage({
    user_id: userId,
    game_room_id: null,
    message: message.trim(),
  });

  const user = await db.one<{ username: string }>(
    "SELECT username FROM users WHERE id = $1",
    [userId]
  );

  return {
    ...savedMessage,
    username: user.username,
  };
}

