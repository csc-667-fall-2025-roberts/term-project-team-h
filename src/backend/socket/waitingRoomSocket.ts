import { Server, Socket } from "socket.io";
import {
  WAITING_ROOM_JOINED,
  WAITING_ROOM_PLAYERS,
  WAITING_ROOM_START,
  GAME_STARTED,
  WAITING_ROOM_LEAVE,
  WAITING_ROOM_DELETE,
  GLOBAL_ROOM,
  LOBBY_ROOM_DELETED
} from "@shared/keys";
import { 
  isUserInWaitingRoom, 
  getWaitingRoomPlayers, 
  removeUserFromWaitingRoom,
  deleteWaitingRoom
} from "../db/waiting_room";

import { startGame } from "@backend/db/game";

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
  socket.on(WAITING_ROOM_LEAVE, async (data: { roomId: number }, act?: () => void) => {
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

    if (typeof act === "function") {
      act();
    }
  });


  // ---------------------------
  // WAITING_ROOM_DELETE (host only)
  // ---------------------------
  socket.on(WAITING_ROOM_DELETE, async (data: { roomId: number }) => {
    const { roomId } = data;

    if (!Number.isFinite(roomId)) {
      socket.emit("waitingRoom:error", { message: "Invalid room ID" });
      return;
    }

    const userId = socket.userId;

    // Make sure this user is in the room
    const inRoom = await isUserInWaitingRoom(roomId, userId);
    if (!inRoom) {
      socket.emit("waitingRoom:error", {
        message: "You are not in this room",
      });
      return;
    }

    // Load players to verify host
    const players = await getWaitingRoomPlayers(roomId);
    const me = players.find(
      (p) => Number(p.userId) === Number(socket.userId)
    );

    if (!me || !me.isGameMaster) {
      socket.emit("waitingRoom:error", {
        message: "Only the host can delete this room",
      });
      return;
    }

    console.log(
      `[waiting-room] Host ${socket.username} (ID: ${userId}) is deleting room ${roomId}`
    );

    // Delete the room (this will cascade to game_room_players etc.)
    await deleteWaitingRoom(roomId);

    // Notify everyone who was in that waiting room
    io.to(`waiting-room:${roomId}`).emit("waitingRoom:deleted", { roomId });
    io.to(GLOBAL_ROOM).emit(LOBBY_ROOM_DELETED, { roomId });
  });




  // ---------------------------
  // WAITING_ROOM_START
  // ---------------------------

  socket.on(WAITING_ROOM_START, async (data: { roomId: number }) => {
    const { roomId }= data;

    try {
      await startGame(roomId);


      io.to(`waiting-room:${roomId}`).emit(GAME_STARTED,{roomId});
    }catch (err){
      console.error("Error starting game [WAITING_ROOM_START]:",err);
      socket.emit("waitingRoom:error", {message: err});
    }
    
  });

}
