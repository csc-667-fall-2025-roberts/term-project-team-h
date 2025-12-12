import express from "express";
import { getLobbyRooms, createGameRoom } from "../db/lobby/index";
import { GLOBAL_ROOM, LOBBY_ROOM_CREATED } from "@shared/keys";
import { Server } from "socket.io";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    console.log(`[LOBBY] GET / - Session ID: ${req.sessionID}, User:`, req.session?.user);
    if (!req.session || !req.session.user) {
      console.log(`[LOBBY] No session or user, redirecting to /auth/login`);
      return res.redirect("/auth/login");
    }

    const rooms = await getLobbyRooms();

    res.render("lobby", {
      rooms,
      currentUser: req.session.user,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/create_game", async (req, res, next) => {
  try {
    if (!req.session || !req.session.user) {
      return res.redirect("/login");
    }

    const { title, maxPlayers, password } = req.body;
    const host = req.session.user;

    const trimmedTitle =
      typeof title === "string" && title.trim().length > 0
        ? title.trim()
        : `${host.username}'s Lobby`;

    let parsedMax = Number(maxPlayers);
    if (!Number.isFinite(parsedMax)) parsedMax = 4;
    parsedMax = Math.max(2, Math.min(4, parsedMax));

    const trimmedPassword =
      typeof password === "string" && password.trim().length > 0
        ? password.trim()
        : null;

    const { id: roomId } = await createGameRoom({
      title: trimmedTitle,
      maxPlayers: parsedMax,
      password: trimmedPassword,
      createdBy: host.id,
    });

    const io = req.app.get("io") as Server | undefined;
    if (io) {
      io.to(GLOBAL_ROOM).emit(LOBBY_ROOM_CREATED, {
        id: roomId,
        title: trimmedTitle,
        maxPlayers: parsedMax,
        hostUsername: host.username,
      });
    }

    // redirect to waiting room with the correct id
    return res.redirect(`/waiting_room/${roomId}`);
  } catch (err) {
    next(err);
  }
});

export { router as lobbyRoutes };
