import { Socket } from "socket.io";
import { isUserInRoom } from "../db/lobby";
import { GLOBAL_ROOM } from "@shared/keys";

export interface ChatSocket extends Socket {
  userId: number;
  username: string;
  currentRoomId?: number | string;
}

export function initializeChatHandlers(socket: ChatSocket): void {
  socket.on("join-room", async (data: { roomId: number | string }) => {
    try {
      const { roomId } = data;

      // Handle global lobby (GLOBAL_ROOM key)
      if (roomId === GLOBAL_ROOM) {
        // Leave previous room if in one
        if (socket.currentRoomId && socket.currentRoomId !== GLOBAL_ROOM) {
          if (typeof socket.currentRoomId === "number") {
            socket.leave(`room:${socket.currentRoomId}`);
          } else {
            socket.leave(socket.currentRoomId);
          }
        }

        socket.join(GLOBAL_ROOM);
        socket.currentRoomId = GLOBAL_ROOM;

        console.log(
          `User ${socket.username} (ID: ${socket.userId}) joined global lobby chat`
        );
        return;
      }

      // Handle room-specific chat
      if (typeof roomId !== "number" || !Number.isFinite(roomId)) {
        socket.emit("chat-error", { message: "Invalid room ID" });
        return;
      }

      const userInRoom = await isUserInRoom(roomId, socket.userId);
      if (!userInRoom) {
        socket.emit("chat-error", { message: "You are not in this room" });
        return;
      }

      // Leave previous room/lobby
      if (socket.currentRoomId) {
        if (socket.currentRoomId === GLOBAL_ROOM) {
          socket.leave(GLOBAL_ROOM);
        } else if (typeof socket.currentRoomId === "number") {
          socket.leave(`room:${socket.currentRoomId}`);
        } else {
          socket.leave(socket.currentRoomId);
        }
      }

      socket.join(`room:${roomId}`);
      socket.currentRoomId = roomId;

      console.log(
        `User ${socket.username} (ID: ${socket.userId}) joined chat room ${roomId}`
      );
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("chat-error", { message: "Failed to join room" });
    }
  });

  socket.on("leave-room", () => {
    if (socket.currentRoomId) {
      if (socket.currentRoomId === GLOBAL_ROOM) {
        socket.leave(GLOBAL_ROOM);
        console.log(
          `User ${socket.username} (ID: ${socket.userId}) left global lobby chat`
        );
      } else if (typeof socket.currentRoomId === "number") {
        socket.leave(`room:${socket.currentRoomId}`);
        console.log(
          `User ${socket.username} (ID: ${socket.userId}) left chat room ${socket.currentRoomId}`
        );
      } else {
        socket.leave(socket.currentRoomId);
      }
      socket.currentRoomId = undefined;
    }
  });

  socket.on("disconnect", () => {
    if (socket.currentRoomId) {
      if (socket.currentRoomId === GLOBAL_ROOM) {
        socket.leave(GLOBAL_ROOM);
        console.log(
          `User ${socket.username} disconnected from global lobby chat`
        );
      } else if (typeof socket.currentRoomId === "number") {
        socket.leave(`room:${socket.currentRoomId}`);
        console.log(
          `User ${socket.username} disconnected from chat room ${socket.currentRoomId}`
        );
      } else {
        socket.leave(socket.currentRoomId);
      }
    }
  });
}

