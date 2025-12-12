// src/frontend/waiting_room.ts
import { io, Socket } from "socket.io-client";
import {
  WAITING_ROOM_JOINED,
  WAITING_ROOM_PLAYERS,
  WAITING_ROOM_START,
  GAME_STARTED,
} from "../shared/keys";

interface WaitingRoomPlayer {
  userId: number;
  username: string;
  isGameMaster: boolean;
}

interface WaitingRoomPlayersPayload {
  roomId: number;
  players: WaitingRoomPlayer[];
}

interface GameStartedPayload {
  roomId: number;
  redirectUrl?: string;
}

export function initializeWaitingRoom(): void {
  const root = document.querySelector<HTMLElement>(".page");
  if (!root) return; // not on a waiting-room-style page

  const roomIdAttr = root.dataset.roomId;
  const isGameMasterAttr = root.dataset.isGamemaster;

  if (!roomIdAttr) {
    console.error("[waiting-room] Missing data-room-id on .page");
    return;
  }

  const roomId = Number(roomIdAttr);
  if (!Number.isFinite(roomId)) {
    console.error("[waiting-room] Invalid room id:", roomIdAttr);
    return;
  }

  const isGameMaster = isGameMasterAttr === "true";

  const playersList =
    document.querySelector<HTMLUListElement>(".player-list");
  const startButton =
    document.getElementById("waiting-start-game") as HTMLButtonElement | null;

  // If there's no players list, nothing to do
  if (!playersList) {
    console.warn("[waiting-room] .player-list not found");
  }

  // Create socket (same pattern as ChatManager: withCredentials: true)
  const socket: Socket = io({ withCredentials: true });

  socket.on("connect", () => {
    console.log("[waiting-room] socket connected", socket.id);
    socket.emit(WAITING_ROOM_JOINED, { roomId });
  });

  socket.on(WAITING_ROOM_PLAYERS, (payload: WaitingRoomPlayersPayload) => {
    if (!playersList) return;
    if (payload.roomId !== roomId) return;

    playersList.innerHTML = "";

    payload.players.forEach((player) => {
      const li = document.createElement("li");
      li.textContent =
        player.username + (player.isGameMaster ? " (Host)" : "");
      playersList.appendChild(li);
    });
  });

  socket.on("waitingRoom:error", (err: { message: string }) => {
    console.error("[waiting-room] error", err);
    alert(err.message || "Something went wrong in the lobby");
    if (startButton) startButton.disabled = false;
  });

  if (startButton && isGameMaster) {
    startButton.addEventListener("click", () => {
      startButton.disabled = true;
      socket.emit(WAITING_ROOM_START, { roomId });
    });
  }

  socket.on(GAME_STARTED, (payload: GameStartedPayload) => {
    if (payload.roomId !== roomId) return;

    const url = payload.redirectUrl ?? `/games/${roomId}`;
    window.location.href = url;
  });
}
