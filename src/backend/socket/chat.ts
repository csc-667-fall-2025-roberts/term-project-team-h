import { Socket } from "socket.io";
import { isUserInRoom } from "../db/lobby";

export interface ChatSocket extends Socket {
  userId: number;
  username: string;
  currentRoomId?: number;
}

export function initializeChatHandlers(socket: ChatSocket): void {
  socket.on("join-room", async (data: { roomId: number }) => {
    try {
      const { roomId } = data;

      if (!roomId || !Number.isFinite(roomId)) {
        socket.emit("chat-error", { message: "Invalid room ID" });
        return;
      }

      const userInRoom = await isUserInRoom(roomId, socket.userId);
      if (!userInRoom) {
        socket.emit("chat-error", { message: "You are not in this room" });
        return;
      }

      if (socket.currentRoomId) {
        socket.leave(`room:${socket.currentRoomId}`);
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
      socket.leave(`room:${socket.currentRoomId}`);
      console.log(
        `User ${socket.username} (ID: ${socket.userId}) left chat room ${socket.currentRoomId}`
      );
      socket.currentRoomId = undefined;
    }
  });

  socket.on("disconnect", () => {
    if (socket.currentRoomId) {
      socket.leave(`room:${socket.currentRoomId}`);
      console.log(
        `User ${socket.username} disconnected from chat room ${socket.currentRoomId}`
      );
    }
  });
}

