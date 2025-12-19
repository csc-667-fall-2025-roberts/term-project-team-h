import { io, Socket } from "socket.io-client";
import {
    GAME_PLAY,
    GAME_DRAW,
    GAME_STATE,
    GAME_JOINED,
    GAME_ERROR,
    GAME_OVER,
} from "../shared/keys";

export function initializeGame(): void {
    const root = document.querySelector<HTMLElement>("body");
    if (!root || !root.dataset.gameId) return;

    const gameId = Number(root.dataset.gameId);
    const myUserId = Number(root.dataset.userId);
    if (!Number.isFinite(gameId)) return;

    const socket: Socket = io({ withCredentials: true });

    socket.on("connect", () => {
        console.log("[game] socket connected", socket.id);
        socket.emit(GAME_JOINED, { gameId });
    });

    // ============================================================
    // LIVE GAME STATE UPDATE  (NO MORE PAGE RELOADS!)
    // ============================================================
    socket.on(GAME_STATE, (state) => {
        console.log("[game] received state update", state);

        updateTopDiscard(state);
        updatePlayersMeta(state);
        updateMyHand(state, gameId, socket, myUserId);
    });

    socket.on(GAME_ERROR, (err) => {
        alert(err.message || "Game error");
    });

    // ============================================================
    // DRAW PILE CLICK
    // ============================================================
    const drawPile = document.getElementById("draw-pile");
    if (drawPile) {
        drawPile.addEventListener("click", () => {
            socket.emit(GAME_DRAW, { gameId });
        });
    }

    // ============================================================
    // WILD COLOR PICKER MODAL
    // ============================================================
    const colorModal = document.getElementById("color-modal");
    const backdrop = colorModal?.querySelector(".color-modal-backdrop") as HTMLElement | null;
    let pendingWildDeckCardId: number | null = null;

    function openColorPicker(deckCardId: number) {
        pendingWildDeckCardId = deckCardId;
        colorModal?.classList.add("open");
    }

    function closeColorPicker() {
        colorModal?.classList.remove("open");
        pendingWildDeckCardId = null;
    }

    // Picked a color
    colorModal?.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
        const slice = target.closest(".color-slice") as HTMLElement | null;
        if (!slice) return;

        const chosenColor = slice.dataset.color;
        if (!chosenColor || pendingWildDeckCardId === null) return;

        console.log("[game] playing wild card", {
            deckCardId: pendingWildDeckCardId,
            chosenColor,
        });

        socket.emit(GAME_PLAY, {
            gameId,
            deckCardId: pendingWildDeckCardId,
            chosenColor,
        });

        closeColorPicker();
    });

    backdrop?.addEventListener("click", closeColorPicker);

    // ============================================================
    // INITIAL BOTTOM-HAND WIRING FOR EJS-RENDERED HAND
    // ============================================================
    wireHandCardClicks(gameId, socket, openColorPicker);

    // ============================================================
    // GAME OVER SCREEN
    // ============================================================
    socket.on(GAME_OVER, ({ winnerId, rankings }) => {
        const overlay = document.getElementById("game-over-overlay")!;
        const contentDiv = document.getElementById("game-over-content")!;

        const winnerIdNum = Number(winnerId);

        contentDiv.innerHTML = "";

        const isWinner = winnerIdNum === myUserId;

        if (isWinner) {
            const winnerMessage = document.createElement("h2");
            winnerMessage.className = "winner-message";
            winnerMessage.textContent = "You are the Winner!";
            contentDiv.appendChild(winnerMessage);
        } else {
            const winner = rankings?.find((r: any) => Number(r.user_id) === winnerIdNum);
            const winnerMessage = document.createElement("h2");
            winnerMessage.className = "winner-announcement";
            winnerMessage.textContent = `Winner: ${winner?.username || "Unknown"}`;
            contentDiv.appendChild(winnerMessage);
        }

        const rankingsTitle = document.createElement("h3");
        rankingsTitle.className = "rankings-title";
        rankingsTitle.textContent = "Final Rankings";
        contentDiv.appendChild(rankingsTitle);

        const rankingsList = document.createElement("div");
        rankingsList.className = "rankings-list";

        const rankLabels = ["1st Place", "2nd Place", "3rd Place", "4th Place"];

        rankings.forEach((player: any, index: number) => {
            const rankItem = document.createElement("div");
            rankItem.className = "rank-item";

            if (Number(player.user_id) === myUserId) {
                rankItem.classList.add("current-user");
            }

            const rankLabel = document.createElement("span");
            rankLabel.className = "rank-label";
            rankLabel.textContent = rankLabels[index] || `${index + 1}th Place`;

            const playerName = document.createElement("span");
            playerName.className = "player-name";
            playerName.textContent = player.username;

            const cardsLeft = document.createElement("span");
            cardsLeft.className = "cards-left";
            cardsLeft.textContent = `${player.cards_left} cards left`;

            rankItem.appendChild(rankLabel);
            rankItem.appendChild(playerName);
            rankItem.appendChild(cardsLeft);

            rankingsList.appendChild(rankItem);
        });

        contentDiv.appendChild(rankingsList);

        overlay.classList.remove("hidden");
    });

    const closeButton = document.getElementById("close-game-btn");
    closeButton?.addEventListener("click", () => {
        console.log("[game] Close button clicked");
        socket.emit("game:close", { gameId });
    });

    socket.on("game:closed", () => {
        console.log("[game] Game closed, redirecting to lobby");
        window.location.href = "/lobby";
    });

    // ============================================================
    // --------------  DOM UPDATE HELPERS  -------------------------
    // ============================================================

    // Top discard image update
    function updateTopDiscard(state: any) {
        const discardImg = document.querySelector<HTMLImageElement>(".card.card-2");
        if (!discardImg) return;

        const top = state.topDiscard;
        if (!top) {
            discardImg.src = "/images/cards/Deck.png";
            return;
        }

        const colorCap = top.color.charAt(0).toUpperCase() + top.color.slice(1);
        discardImg.src = `/images/cards/${colorCap}_${top.value}.png`;
    }

    // Player counts + turn highlight update
    function updatePlayersMeta(state: any) {
        document.querySelectorAll<HTMLElement>(".player").forEach((playerDiv) => {
            const nameEl = playerDiv.querySelector(".player-name") as HTMLElement;
            const countEl = playerDiv.querySelector(".card-count") as HTMLElement;
            if (!nameEl || !countEl) return;

            const username = nameEl.textContent?.trim();
            const p = state.players.find((pl: any) => pl.username === username);
            if (!p) return;

            countEl.textContent = `Card Count: ${p.cards_in_hand}`;

            if (p.id === state.currentPlayerId) {
                playerDiv.classList.add("my-turn");
            } else {
                playerDiv.classList.remove("my-turn");
            }
        });
    }

    // Re-render MY hand (bottom hand)
    function updateMyHand(state: any, gameId: number, socket: Socket, myUserId: number) {
        const me = state.players.find((p: any) => Number(p.user_id) === myUserId);
        if (!me) return;

        const hand = state.handsByPlayerId?.[me.id] || [];
        const bottomDiv = document.querySelector(".player-bottom") as HTMLElement;
        if (!bottomDiv) return;

        // Remove old cards
        bottomDiv.querySelectorAll(".bottom-player-card").forEach((el) => el.remove());

        // Update card count
        const countEl = bottomDiv.querySelector(".card-count") as HTMLElement;
        if (countEl) countEl.textContent = `Card Count: ${hand.length}`;

        // Add all cards
        hand.forEach((card: any) => {
            const img = document.createElement("img");
            img.className = "bottom-player-card";
            img.setAttribute("data-card-id", String(card.deckCardId));
            img.setAttribute("data-value", card.value);

            const colorCap = card.color.charAt(0).toUpperCase() + card.color.slice(1);
            img.src = `/images/cards/${colorCap}_${card.value}.png`;

            bottomDiv.appendChild(img);
        });

        // Rebind click logic
        wireHandCardClicks(gameId, socket, openColorPicker);
    }
}

// ============================================================
// CLICK HANDLER WIRING FOR HAND CARDS (REUSABLE)
// ============================================================
function wireHandCardClicks(
    gameId: number,
    socket: Socket,
    openColorPicker: (deckCardId: number) => void
) {
    document.querySelectorAll(".bottom-player-card").forEach((card) => {
        const newCard = card.cloneNode(true) as HTMLElement;
        card.replaceWith(newCard);

        newCard.addEventListener("click", () => {
            const deckCardId = Number(newCard.getAttribute("data-card-id"));
            const value = newCard.getAttribute("data-value");

            const isWild = value === "wild" || value === "wild_draw_four";

            if (isWild) {
                openColorPicker(deckCardId);
                return;
            }

            socket.emit(GAME_PLAY, {
                gameId,
                deckCardId,
            });
        });
    });
}
