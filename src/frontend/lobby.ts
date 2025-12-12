import { io, Socket } from "socket.io-client";
import { GLOBAL_ROOM, LOBBY_ROOM_CREATED } from "@shared/keys";

export function initializeLobbyPage(): void {
  const lobbyRoot = document.querySelector(".lobby-page");
  if (!lobbyRoot) return;

  const socket: Socket = io({ withCredentials: true });

  socket.on("connect", () => {
    console.log("[lobby] socket connected", socket.id);
    socket.emit("join-room", { roomId: GLOBAL_ROOM });
  });

  socket.on(LOBBY_ROOM_CREATED, (payload) => {
    console.log("[lobby] room created:", payload);

    window.location.reload();
  });
}