/**
 * Game room + lobby operations
 */

import db from "../connection";
import { gameRoomQueries } from "./sql";

export type GameStatus = "waiting" | "in_progress" | "finished";

export interface GameRoom {
  id: number;
  title: string | null;
  status: GameStatus;
  maxPlayers: number;
  password: string | null;
  createdBy: number;
  createdAt: Date;
  startedAt: Date | null;
  endedAt: Date | null;
}

export interface LobbyRoom {
  id: number;
  title: string | null;
  hostUsername: string;
  status: GameStatus;
  currentPlayers: number;
  maxPlayers: number;
  hasPassword: boolean;
  createdAt: Date;
}

export interface CreateGameRoomData {
  title: string | null;
  maxPlayers: number;
  password?: string | null;
  createdBy: number;
}

/**
 * List all rooms visible in the lobby (waiting status)
 */
export async function getLobbyRooms(): Promise<LobbyRoom[]> {
  // status comes back as string; we narrow it to GameStatus
  const rows = await db.manyOrNone<
    LobbyRoom & { status: string }
  >(gameRoomQueries.lobbyList);

  return rows.map((row) => ({
    ...row,
    status: row.status as GameStatus,
  }));
}

/**
 * Create a new game room + add the host as a player in a single transaction
 */
export async function createGameRoom(
  data: CreateGameRoomData
): Promise<LobbyRoom> {
  return db.tx(async (t) => {
    const { title, maxPlayers, password = null, createdBy } = data;

    // Create the room
    const room = await t.one<{
      id: number;
      title: string | null;
      status: string;
      maxPlayers: number;
      createdAt: Date;
    }>(gameRoomQueries.createRoom, [title, maxPlayers, password, createdBy]);

    // Host joins as game master
    await t.one(gameRoomQueries.addPlayerToRoom, [
      createdBy, // user_id
      room.id, // game_room_id
      true, // is_game_master
      0, // player_order
      0, // cards_in_hand
    ]);

    // Count players
    const countResult = await t.one<{ playerCount: number }>(
      gameRoomQueries.countPlayersInRoom,
      [room.id]
    );

    return {
      id: room.id,
      title: room.title,
      hostUsername: "",
      status: room.status as GameStatus,
      currentPlayers: countResult.playerCount,
      maxPlayers: room.maxPlayers,
      hasPassword: !!password,
      createdAt: room.createdAt,
    };
  });
}

/**
 * Simple helper to fetch a single room by id
 */
export async function findGameRoomById(id: number): Promise<GameRoom | null> {
  const room = await db.oneOrNone<GameRoom & { status: string }>(
    gameRoomQueries.findRoomById,
    [id]
  );

  if (!room) return null;

  return {
    ...room,
    status: room.status as GameStatus,
  };
}

/**
 * Check if a user is already in a game room
 */
export async function isUserInRoom(
  roomId: number,
  userId: number
): Promise<boolean> {
  const existing = await db.oneOrNone<{ id: number }>(
    gameRoomQueries.findPlayerInRoom,
    [roomId, userId]
  );
  return !!existing;
}
