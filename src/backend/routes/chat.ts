import express from "express";
import { Server as SocketIOServer } from "socket.io";
import * as Chat from "../db/chat";
import { isUserInRoom } from "../db/lobby";
import { requireUser } from "../middleware";
import { CHAT_LISTING, CHAT_MESSAGE, GLOBAL_ROOM } from "@shared/keys";

const router = express.Router();

// Global lobby chat
router.get("/", requireUser, async (request, response) => {
  response.status(202).send();

  if (!request.session?.user) {
    return;
  }

  const messages = await Chat.list();

  const io = request.app.get("io") as SocketIOServer;
  const sessionId = request.session.id;
  io.to(sessionId).emit(CHAT_LISTING, { messages });
});

router.post("/", requireUser, async (request, response) => {
  response.status(202).send();

  if (!request.session?.user) {
    return;
  }

  const { id } = request.session.user;
  const { message } = request.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return;
  }

  if (message.trim().length > 140) {
    return;
  }

  const result = await Chat.create(id, message.trim());

  const io = request.app.get("io") as SocketIOServer;
  io.to(GLOBAL_ROOM).emit(CHAT_MESSAGE, result);
});

// Room-specific chat
router.get("/:roomId", requireUser, async (request, response) => {
  response.status(202).send();

  if (!request.session?.user) {
    return;
  }

  const roomId = Number(request.params.roomId);
  if (!Number.isFinite(roomId)) {
    return;
  }

  const userId = request.session.user.id;
  const userInRoom = await isUserInRoom(roomId, userId);
  if (!userInRoom) {
    return;
  }

  const messages = await Chat.findChatMessagesByGameRoom(roomId);

  const io = request.app.get("io") as SocketIOServer;
  const sessionId = request.session.id;
  io.to(sessionId).emit(CHAT_LISTING, { messages });
});

router.post("/:roomId", requireUser, async (request, response) => {
  response.status(202).send();

  if (!request.session?.user) {
    return;
  }

  const roomId = Number(request.params.roomId);
  if (!Number.isFinite(roomId)) {
    return;
  }

  const userId = request.session.user.id;
  const userInRoom = await isUserInRoom(roomId, userId);
  if (!userInRoom) {
    return;
  }

  const { message } = request.body;
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return;
  }

  if (message.trim().length > 140) {
    return;
  }

  const savedMessage = await Chat.createChatMessage({
    user_id: userId,
    game_room_id: roomId,
    message: message.trim(),
  });

  const messageWithUsername: Chat.ChatMessageWithUsername = {
    ...savedMessage,
    username: request.session.user.username,
  };

  const io = request.app.get("io") as SocketIOServer;
  io.to(`room:${roomId}`).emit(CHAT_MESSAGE, messageWithUsername);
});

export { router as chatRoutes };
