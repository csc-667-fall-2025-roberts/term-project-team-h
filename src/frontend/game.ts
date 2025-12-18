import { io, Socket } from "socket.io-client";
import {
    GAME_PLAY,
    GAME_DRAW,
    GAME_STATE,
    GAME_JOINED,
    GAME_ERROR,
} from "../shared/keys";

export function initializeGame(): void {
    const root = document.querySelector<HTMLElement>("body");
    if (!root || !root.dataset.gameId) return; // not a game page

    const gameId = Number(root.dataset.gameId);
    if (!Number.isFinite(gameId)) return;

    const socket: Socket = io({ withCredentials: true });

    socket.on("connect", () => {
        console.log("[game] socket connected", socket.id);
        socket.emit(GAME_JOINED, { gameId });
    });

    socket.on(GAME_STATE, (state) => {
        console.log("[game] received state update", state);
        window.location.reload();
    });

    socket.on(GAME_ERROR, (err) => {
        alert(err.message || "Game error");
    });

    /**
     * DRAW PILE
     */
    const drawPile = document.getElementById("draw-pile");
    if (drawPile) {
        drawPile.addEventListener("click", () => {
            socket.emit(GAME_DRAW, { gameId });
        });
    }

    /**
     * COLOR PICKER MODAL WIRING
     */
    const colorModal = document.getElementById("color-modal");
    const backdrop = colorModal?.querySelector(".color-modal-backdrop") as HTMLElement | null;
    let pendingWildDeckCardId: number | null = null;

    function openColorPicker(deckCardId: number) {
        pendingWildDeckCardId = deckCardId;
        if (colorModal) {
            colorModal.classList.add("open");
        }
    }

    function closeColorPicker() {
        if (colorModal) {
            colorModal.classList.remove("open");
        }
        pendingWildDeckCardId = null;
    }

    // Handle slice clicks
    if (colorModal) {
        colorModal.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            const slice = target.closest(".color-slice") as HTMLElement | null;
            if (!slice) return;

            const chosenColor = slice.dataset.color;
            if (!chosenColor || pendingWildDeckCardId == null) return;

            console.log("[game] playing wild card", {
                deckCardId: pendingWildDeckCardId,
                chosenColor,
            });

            socket.emit(GAME_PLAY, {
                gameId,
                deckCardId: pendingWildDeckCardId,
                chosenColor, // <-- backend should accept this for wild/+4
            });

            closeColorPicker();
        });
    }

    // Optional: click backdrop to cancel
    if (backdrop) {
        backdrop.addEventListener("click", () => {
            closeColorPicker();
        });
    }

    /**
     * HAND CARD CLICKS
     */
    document.querySelectorAll<HTMLImageElement>(".bottom-player-card").forEach((card) => {
        card.addEventListener("click", () => {
            const deckCardIdAttr = card.getAttribute("data-card-id");
            if (!deckCardIdAttr) return;

            const deckCardId = Number(deckCardIdAttr);
            const value = card.getAttribute("data-value");

            // Adjust these strings to your DB values for wild / +4
            const isWild =
                value === "wild" ||
                value === "wild_draw_4" ||
                value === "plus4" ||
                value === "wild_plus_4";

            if (isWild) {
                // open color picker instead of playing immediately
                openColorPicker(deckCardId);
                return;
            }

            console.log("Playing normal card with deckCardId:", deckCardId);

            socket.emit(GAME_PLAY, {
                gameId,
                deckCardId,
            });
        });
    });
}
