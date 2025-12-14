import { io, Socket } from "socket.io-client";
import {
    WAITING_ROOM_JOINED,
    WAITING_ROOM_PLAYERS,
    WAITING_ROOM_START,
    GAME_STARTED,
    WAITING_ROOM_LEAVE,
    WAITING_ROOM_DELETE,
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
    if (!root || !root.dataset.roomId) return; // not a waiting-room page

    const roomIdAttr = root.dataset.roomId;
    const isGameMasterAttr = root.dataset.isGamemaster;

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
    const leaveButton =
        document.getElementById("waiting-leave-game") as HTMLButtonElement | null;
    const deleteButton =
        document.getElementById("waiting-delete-room") as HTMLButtonElement | null;

    // Create socket (same pattern as ChatManager: withCredentials: true)
    const socket: Socket = io({ withCredentials: true });

    socket.on("connect", () => {
        console.log("[waiting-room] socket connected", socket.id, "roomId=", roomId);
        socket.emit(WAITING_ROOM_JOINED, { roomId });
    });

    socket.on(WAITING_ROOM_PLAYERS, (payload: WaitingRoomPlayersPayload) => {
        console.log("[waiting-room] received WAITING_ROOM_PLAYERS", payload);

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

    socket.on("waitingRoom:deleted", (payload: { roomId: number }) => {
        if (payload.roomId !== roomId) return;

        console.log("[waiting-room] room deleted, redirecting to lobby");
        window.location.href = "/lobby";
    });

    socket.on(GAME_STARTED, (payload: GameStartedPayload) => {
        if (payload.roomId !== roomId) return;

        const url = payload.redirectUrl ?? `/games/${roomId}`;
        window.location.href = url;
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

    if (leaveButton) {
        leaveButton.addEventListener("click", () => {
            console.log("[waiting-room] leaving room", roomId);
            socket.emit(WAITING_ROOM_LEAVE, { roomId }, () => {
                window.location.href = "/lobby";
            });
        });
    }

    if (deleteButton && isGameMaster) {
        deleteButton.addEventListener("click", () => {
            const confirmed = window.confirm(
                "Are you sure you want to delete this room for everyone?"
            );
            if (!confirmed) return;

            console.log("[waiting-room] deleting room", roomId);
            socket.emit(WAITING_ROOM_DELETE, { roomId });
        });
    }
}
