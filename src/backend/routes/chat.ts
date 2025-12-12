import express, { Request, Response } from "express";
import { Server as SocketIOServer } from "socket.io";
import * as chatDB from "../db/chat";
import { isUserInRoom } from "../db/lobby";
import { requireUser } from "../middleware";

const router = express.Router();

function getValidatedRoomId(roomIdParam: string | undefined): number | null {
  if (!roomIdParam) {
    return null;
  }
  const roomId = Number(roomIdParam);
  return Number.isFinite(roomId) ? roomId : null;
}

async function checkUserInRoom(roomId: number, userId: number): Promise<boolean> {
  return await isUserInRoom(roomId, userId);
}

async function validateChatRequest(
  req: Request,
  res: Response
): Promise<{ valid: false; response: Response } | { valid: true; roomId: number; userId: number }> {
  if (!req.session || !req.session.user) {
    return { valid: false, response: res.status(401).json({ error: "Unauthorized" }) };
  }

  const roomId = getValidatedRoomId(req.params.roomId);
  if (roomId === null) {
    return { valid: false, response: res.status(400).json({ error: "Invalid room ID" }) };
  }

  const userId = req.session.user.id;
  const userInRoom = await checkUserInRoom(roomId, userId);
  if (!userInRoom) {
    return { valid: false, response: res.status(403).json({ error: "You are not in this room" }) };
  }

  return { valid: true, roomId, userId };
}

function getValidatedMessage(message: unknown): string | null {
  if (!message || typeof message !== "string") {
    return null;
  }

  const trimmedMessage = message.trim();
  if (trimmedMessage.length === 0) {
    return null;
  }

  if (trimmedMessage.length > 140) {
    return null;
  }

  return trimmedMessage;
}

router.get("/:roomId", requireUser, async (req, res, next) => {
  try {
    const validation = await validateChatRequest(req, res);
    if (!validation.valid) {
      return validation.response;
    }

    const { roomId } = validation;

    const messages = await chatDB.findChatMessagesByGameRoom(roomId);
    return res.json({ messages });
  } catch (err) {
    next(err);
  }
});

router.post("/:roomId", requireUser, async (req, res, next) => {
  try {
    const validation = await validateChatRequest(req, res);
    if (!validation.valid) {
      return validation.response;
    }

    const { roomId, userId } = validation;

    const validatedMessage = getValidatedMessage(req.body.message);
    if (validatedMessage === null) {
      const { message } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Invalid message" });
      }
      const trimmed = message.trim();
      if (trimmed.length === 0) {
        return res.status(400).json({ error: "Message cannot be empty" });
      }
      if (trimmed.length > 140) {
        return res.status(400).json({ error: "Message is too long (max 140 characters)" });
      }
      return res.status(400).json({ error: "Invalid message" });
    }

    const username = req.session!.user!.username;
    const savedMessage = await chatDB.createChatMessage({
      user_id: userId,
      game_room_id: roomId,
      message: validatedMessage,
    });

    const messageWithUsername: chatDB.ChatMessageWithUsername = {
      ...savedMessage,
      username,
    };

    const io = req.app.get("io") as SocketIOServer;
    if (io) {
      io.to(`room:${roomId}`).emit("new-message", {
        roomId,
        message: messageWithUsername,
      });
    }

    return res.status(201).json({ message: messageWithUsername });
  } catch (err) {
    next(err);
  }
});

export { router as chatRoutes };

