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

    socket.on(GAME_OVER, ({ winnerId, rankings }) => {
        const overlay = document.getElementById("game-over-overlay")!;
        const contentDiv = document.getElementById("game-over-content")!;

        const myUserId = Number(
            document.body.dataset.userId
        )
        const winnerIdNum = Number(winnerId);

        console.log("Game Over - Winner ID:", winnerIdNum, "My User ID:", myUserId);
        console.log("Rankings:", rankings);


        contentDiv.innerHTML = '';

        const isWinner = winnerIdNum === myUserId;

        if (isWinner){
            const winnerMessage = document.createElement('h2');
            winnerMessage.className = 'winner-message';
            winnerMessage.textContent = 'You are the Winner!';
            contentDiv.appendChild(winnerMessage);
        }else {
            const winner = rankings?.find((r: any) => Number(r.user_id) === winnerIdNum);
            console.log("Found winner:", winner);
            const winnerMessage = document.createElement('h2');
            winnerMessage.className = 'winner-announcement';
            winnerMessage.textContent = `Winner: ${winner?.username || 'Unknown'}`;
            contentDiv.appendChild(winnerMessage);
        }

        const rankingsTitle = document.createElement('h3');
        rankingsTitle.className = 'rankings-title';
        rankingsTitle.textContent = 'Final Rankings';
        contentDiv.appendChild(rankingsTitle);

        const rankingsList = document.createElement('div');
        rankingsList.className = 'rankings-list';

        const rankLabels = ['1st Place', '2nd Place',  '3rd Place', '4th Place'];

        rankings.forEach((player: any, index: number) => {
            const rankItem = document.createElement('div');
            rankItem.className = 'rank-item';
        
            if (Number(player.user_id) === myUserId) {
                rankItem.classList.add('current-user');
            }
        
            const rankLabel = document.createElement('span');
            rankLabel.className = 'rank-label';
            rankLabel.textContent = rankLabels[index] || `${index + 1}th Place`;
        
            const playerName = document.createElement('span');
            playerName.className = 'player-name';
            playerName.textContent = player.username;
        
            const cardsLeft = document.createElement('span');
            cardsLeft.className = 'cards-left';
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
    if (closeButton) {
        closeButton.addEventListener("click", () => {
            console.log("[game] Close button clicked"); 
            socket.emit("game:close", { gameId });
        });
    }
    socket.on("game:closed", () => {
        console.log("[game] Game closed, redirecting to lobby");
        window.location.href = "/lobby";
    });

}