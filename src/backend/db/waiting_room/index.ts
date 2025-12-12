import db from "../connection";
import { waitingRoomQueries } from "./sql";

export type GameStatus = "waiting" | "in_progress" | "finished";

export interface WaitingRoom {
  id: number;
  title: string | null;
  status: GameStatus;
  maxPlayers: number;
  password: string | null;
  createdBy: number;
  createdAt: Date;
  startedAt: Date | null;
  endedAt: Date | null;
  hostUsername: string;
}

export interface WaitingRoomPlayer {
  id: number;
  userId: number;
  gameRoomId: number;
  username: string;
  isGameMaster: boolean;
  playerOrder: number | null;
  cardsInHand: number;
  joinedAt: Date;
}

/**
 * Get room info + host username for waiting room view.
 */
export async function getWaitingRoom(
  roomId: number
): Promise<WaitingRoom | null> {
  const row = await db.oneOrNone<
    WaitingRoom & { status: string }
  >(waitingRoomQueries.findRoomWithHost, [roomId]);

  if (!row) return null;

  return {
    ...row,
    status: row.status as GameStatus,
  };
}

/**
 * Get all players currently in a waiting room.
 */
export async function getWaitingRoomPlayers(
  roomId: number
): Promise<WaitingRoomPlayer[]> {
  const players = await db.manyOrNone<WaitingRoomPlayer>(
    waitingRoomQueries.listPlayersInRoom,
    [roomId]
  );
  return players || [];
}

/**
 * Check if a user is already in this room.
 */
export async function isUserInWaitingRoom(
  roomId: number,
  userId: number
): Promise<boolean> {
  const existing = await db.oneOrNone(waitingRoomQueries.findPlayerInRoom, [
    roomId,
    userId,
  ]);
  return !!existing;
}

/**
 * Count players in the room.
 */
export async function countWaitingRoomPlayers(
  roomId: number
): Promise<number> {
  const row = await db.one<{ playerCount: number }>(
    waitingRoomQueries.countPlayersInRoom,
    [roomId]
  );
  return row.playerCount;
}

/**
 * Add a player into the waiting room (non-host join).
 */
export async function addPlayerToWaitingRoom(options: {
  roomId: number;
  userId: number;
  isGameMaster?: boolean;
}): Promise<WaitingRoomPlayer> {
  const { roomId, userId, isGameMaster = false } = options;

  // decide the player_order: append at the end
  const currentCount = await countWaitingRoomPlayers(roomId);
  const playerOrder = currentCount; // 0-based order

  const player = await db.one<WaitingRoomPlayer>(
    waitingRoomQueries.addPlayerToRoom,
    [userId, roomId, isGameMaster, playerOrder, 0]
  );

  return player;
}

/**
 * Update the room password from the waiting room.
 * Passing null/empty will clear the password.
 */
export async function setWaitingRoomPassword(
  roomId: number,
  password: string | null
): Promise<WaitingRoom | null> {
  const normalized =
    password && password.trim().length > 0 ? password.trim() : null;

  const row = await db.oneOrNone<
    WaitingRoom & { status: string }
  >(waitingRoomQueries.updateRoomPassword, [roomId, normalized]);

  if (!row) return null;

  return {
    ...row,
    status: row.status as GameStatus,
  };
}

export async function removeUserFromWaitingRoom(
  roomId: number,
  userId: number
): Promise<void> {
  await db.none(waitingRoomQueries.removePlayerFromRoom, [roomId, userId]);
}

