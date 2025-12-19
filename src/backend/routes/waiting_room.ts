import express from "express";
import {
  getWaitingRoom,
  getWaitingRoomPlayers,
  isUserInWaitingRoom,
  addPlayerToWaitingRoom,
} from "../db/waiting_room";
import {
  getLobbyRooms
} from "../db/lobby"

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
    const me = players.find((p) => Number(p.userId) === userId);
    const isHost = !!me && me.isHost;

    return res.render("waiting_room", {
      room,
      players,
      isHost,
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
      // If this came from fetch, return JSON; otherwise redirect.
      const wantsJSON = req.headers.accept?.includes("application/json");
      if (wantsJSON) return res.status(401).json({ ok: false, message: "Not logged in" });
      return res.redirect("/login");
    }

    const roomId = Number(req.params.id);
    if (!Number.isFinite(roomId)) {
      return res.status(400).json({ ok: false, message: "Invalid room id" });
    }

    const userId = req.session.user.id;

    // --- Load room (waiting room) ---
    const room = await getWaitingRoom(roomId);
    if (!room) {
      return res.status(404).json({ ok: false, message: "Room not found" });
    }

    // --- If already in room, allow re-entry even if full ---
    const inRoom = await isUserInWaitingRoom(roomId, userId);
    if (inRoom) {
      if (req.headers.accept?.includes("application/json")) {
        return res.status(200).json({ ok: true, redirect: `/waiting_room/${roomId}` });
      }
      return res.redirect(`/waiting_room/${roomId}`);
    }

    // capacity check
    const currentPlayers = await getWaitingRoomPlayers(roomId);
    const currentCount = currentPlayers.length;

    const maxPlayers = room.maxPlayers;
    if (Number.isFinite(maxPlayers) && currentCount >= maxPlayers) {
      if (req.headers.accept?.includes("application/json")) {
        return res.status(409).json({ ok: false, message: "Room is full" });
      }
      return res.status(409).render("lobby", {
        rooms: await getLobbyRooms(),
        currentUser: req.session.user,
        joinError: "Room is full",
      });
    }

    // Password check
    const submittedPassword = (req.body.password || "").trim();

    if (room.password !== null) {
      if (!submittedPassword || submittedPassword !== room.password) {
        // Fetch path (your modal)
        if (req.headers.accept?.includes("application/json")) {
          return res.status(403).json({ ok: false, message: "Incorrect password" });
        }

        // Normal submit fallback
        return res.status(403).render("lobby", {
          rooms: await getLobbyRooms(),
          currentUser: req.session.user,
          joinError: "Incorrect password",
        });
      }
    }

    // Join
    await addPlayerToWaitingRoom({ roomId, userId });

    // Fetch path
    if (req.headers.accept?.includes("application/json")) {
      return res.status(200).json({ ok: true, redirect: `/waiting_room/${roomId}` });
    }

    return res.redirect(`/waiting_room/${roomId}`);
  } catch (err) {
    next(err);
  }
});


export { router as waitingRoomRoutes };
