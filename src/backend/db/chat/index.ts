/**
 * Chat database operations
 * 
 * This module provides functions for managing chat messages.
 * It follows a pattern where SQL queries are separated in sql.ts and
 * business logic functions are defined here.
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

