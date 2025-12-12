import { Server, Socket } from "socket.io";
import {
  WAITING_ROOM_JOINED,
  WAITING_ROOM_PLAYERS,
  WAITING_ROOM_START,
  GAME_STARTED,
  WAITING_ROOM_LEAVE,
} from "@shared/keys";
import { 
  isUserInWaitingRoom, 
  getWaitingRoomPlayers, 
  removeUserFromWaitingRoom 
} from "../db/waiting_room";

export interface WaitRoomSocket extends Socket {
  userId: number;
  username: string;
  currentWaitingRoomId?: number;
}

export function initializeWaitRoomHandlers(socket: WaitRoomSocket, io: Server): void {
  // ---------------------------
  // WAITING_ROOM_JOINED
  // ---------------------------
  socket.on(WAITING_ROOM_JOINED, async (data: { roomId: number }) => {
    const { roomId } = data;

    // Validate input
    if (!Number.isFinite(roomId)) {
      socket.emit("lobby:error", { message: "Invalid room ID" });
      return;
    }

    // Validate user against DB output
    const inRoom = await isUserInWaitingRoom(roomId, socket.userId);
    if (!inRoom) {
      socket.emit("lobby:error", { message: "You are not in this room" });
      return;
    }

    // Leave previous waiting room socket.io room 
    if (socket.currentWaitingRoomId && socket.currentWaitingRoomId !== roomId) {
      socket.leave(`waiting-room:${socket.currentWaitingRoomId}`);
    }

    // Join this waiting room channel
    socket.join(`waiting-room:${roomId}`);
    socket.currentWaitingRoomId = roomId;

    console.log(
      `User ${socket.username} joined waiting room ${roomId}`
    );

    // Fetch updated players list from DB
    const players = await getWaitingRoomPlayers(roomId);

    // Broadcast updated lobby state to everyone in the room
    io.to(`waiting-room:${roomId}`).emit(WAITING_ROOM_PLAYERS, {
      roomId,
      players,
    });
  });


  // ---------------------------
  // WAITING_ROOM_LEAVE
  // ---------------------------
  socket.on(WAITING_ROOM_LEAVE, async (data: { roomId: number }) => {
    const { roomId } = data;

    if (!Number.isFinite(roomId)) {
      socket.emit("waitingRoom:error", { message: "Invalid room ID" });
      return;
    }

    const userId = socket.userId;

    // Check if user is actually in the waiting room
    const inRoom = await isUserInWaitingRoom(roomId, userId);
    if (!inRoom) {
      socket.emit("waitingRoom:error", { message: "You are not in this room" });
      return;
    }

    // Remove user from DB
    await removeUserFromWaitingRoom(roomId, userId);

    // Leave socket.io room
    socket.leave(`waiting-room:${roomId}`);
    socket.currentWaitingRoomId = undefined;

    console.log(
      `User ${socket.username} left waiting room ${roomId}`
    );

    // Fetch updated players
    let players = await getWaitingRoomPlayers(roomId);

    // Broadcast updated player list
    io.to(`waiting-room:${roomId}`).emit(WAITING_ROOM_PLAYERS, {
      roomId,
      players,
    });
  });

  // ---------------------------
  // WAITING_ROOM_LEAVE
  // ---------------------------
  socket.on(WAITING_ROOM_LEAVE, async (data: { roomId: number }) => {
    const { roomId } = data;
  });
}
