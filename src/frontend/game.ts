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


    //temp

    socket.on(GAME_STATE, (state) => {
        console.log("[game] received state update", state);
        window.location.reload();
    });


    socket.on(GAME_ERROR, (err) => {
        alert(err.message || "Game error");
    });

    /**
     *  When a player clicks on the draw pile
     */
    const drawPile = document.getElementById("draw-pile");
    if (drawPile) {
        drawPile.addEventListener("click",()=> {
            socket.emit(GAME_DRAW,{gameId});
        });
    }

    document.querySelectorAll(".bottom-player-card").forEach(card => {

        card.addEventListener("click", () => {
            const deckCardId = card.getAttribute("data-card-id");
            console.log("Playing card with deckCardId:", deckCardId);
            if (!deckCardId){
                return;
            }

            socket.emit(GAME_PLAY, {
                gameId,
                deckCardId: Number(deckCardId),
            });
        });

    });

}