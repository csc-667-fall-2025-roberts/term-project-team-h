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
 * Find a chat message by ID
 */
export async function findChatMessageById(id: number): Promise<ChatMessage | null> {
  const message = await db.oneOrNone<ChatMessage>(chatQueries.findById, [id]);
  return message;
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
 * Find all chat messages by a user
 */
export async function findChatMessagesByUser(userId: number): Promise<ChatMessage[]> {
  const messages = await db.manyOrNone<ChatMessage>(chatQueries.findByUser, [userId]);
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
 * Update a chat message
 */
export async function updateChatMessage(
  id: number,
  message: string
): Promise<ChatMessage | null> {
  const updatedMessage = await db.oneOrNone<ChatMessage>(chatQueries.update, [message, id]);
  return updatedMessage;
}

/**
 * Delete a chat message
 */
export async function deleteChatMessage(id: number): Promise<boolean> {
  const result = await db.result(chatQueries.delete, [id]);
  return result.rowCount > 0;
}

/**
 * Delete all chat messages for a game room
 */
export async function deleteChatMessagesByGameRoom(gameRoomId: number): Promise<number> {
  const result = await db.result(chatQueries.deleteByGameRoom, [gameRoomId]);
  return result.rowCount;
}

/**
 * Get recent chat messages for a game room
 */
export async function getRecentChatMessages(
  gameRoomId: number,
  limit: number = 50
): Promise<ChatMessageWithUsername[]> {
  const messages = await db.manyOrNone<ChatMessageWithUsername>(
    chatQueries.recentMessages,
    [gameRoomId, limit]
  );
  return messages || [];
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

