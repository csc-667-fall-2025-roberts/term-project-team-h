import express from "express";
import {
  getWaitingRoom,
  getWaitingRoomPlayers,
  isUserInWaitingRoom,
  addPlayerToWaitingRoom,
} from "../db/waiting_room";

const router = express.Router();

/**
 * GET /waiting_room/:id
 */
router.get("/:id", async (req, res, next) => {
  try {
    if (!req.session || !req.session.user) {
      return res.redirect("/login");
    }

    const roomId = Number(req.params.id);
    if (!Number.isFinite(roomId)) {
      return res.status(400).send("Invalid room id");
    }

    const room = await getWaitingRoom(roomId);
    if (!room) {
      return res.status(404).render("error", { message: "Room not found" });
    }

    const userId = req.session.user.id;

    // Make sure this user is actually in the room
    const inRoom = await isUserInWaitingRoom(roomId, userId);
    if (!inRoom) {
      // if they somehow hit the URL directly, send them back
      return res.redirect("/lobby");
    }

    const players = await getWaitingRoomPlayers(roomId);
    const me = players.find((p) => p.userId === userId);
    const isGameMaster = !!me && me.isGameMaster;

    return res.render("waiting_room", {
      room,
      players,
      isGameMaster,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /waiting_room/:id/join
 */
router.post("/:id/join", async (req, res, next) => {
  try {
    if (!req.session || !req.session.user) {
      return res.redirect("/login");
    }

    const roomId = Number(req.params.id);
    if (!Number.isFinite(roomId)) {
      return res.status(400).send("Invalid room id");
    }

    const userId = req.session.user.id;

    // If they're already in the room, just send them there
    const inRoom = await isUserInWaitingRoom(roomId, userId);
    if (!inRoom) {
      await addPlayerToWaitingRoom({ roomId, userId });
    }

    return res.redirect(`/waiting_room/${roomId}`);
  } catch (err) {
    next(err);
  }
});

export { router as waitingRoomRoutes };
