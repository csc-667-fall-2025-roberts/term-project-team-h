import { Server, Socket } from "socket.io";
import {
  GAME_JOINED,
  GAME_DRAW,
  GAME_PLAY,
  GAME_STATE,
  GAME_ERROR,
  GAME_OVER,
} from "@shared/keys";


import {
    findGameRoomPlayersByGameRoom,
    drawCardForPlayer,
    playCard,
    deleteGameRoom,
    findGameResultPlayersByGameResult,
    findGameRoomById,
    findGameRoomDecksByPlayer,
    getTopDiscardCard,
    findUnoCardById,
    getCurrentPlayer,
    findGameResultByGameRoom,
} from "@backend/db/game"

export interface GameSocket extends Socket {
    userId: number;
    username: string;
    currentGameRoomId?: number;
}

async function buildGameState(gameId: number) {
  // Game room & players
  const gameRoom = await findGameRoomById(gameId);
  const players = await findGameRoomPlayersByGameRoom(gameId); // with username

  // Who's turn is it?
  const currentPlayer = await getCurrentPlayer(gameId);

  // Top discard card (deck row) + its UnoCard
  const topDiscardDeck = await getTopDiscardCard(gameId);
  let topDiscard: null | {
    deckCardId: number;
    cardId: number;
    color: string;
    value: string;
  } = null;

  if (topDiscardDeck) {
    const card = await findUnoCardById(topDiscardDeck.card_id);
    if (card) {
      topDiscard = {
        deckCardId: topDiscardDeck.id,
        cardId: card.id,
        color: card.color,
        value: card.value,
      };
    }
  }

  const handsByPlayerId: Record<
    number,
    { deckCardId: number; cardId: number; color: string; value: string }[]
  > = {};

  for (const p of players) {
    const handDecks = await findGameRoomDecksByPlayer(gameId, p.id);
    handsByPlayerId[p.id] = handDecks.map((d) => ({
      deckCardId: d.id,
      cardId: d.card_id,
      color: (d as any).color,
      value: (d as any).value,
    }));
  }

  return {
    gameId,
    status: gameRoom?.status,
    currentPlayerId: currentPlayer?.id ?? null,
    currentColor: gameRoom?.current_color ?? null,
    players: players.map((p) => ({
      id: p.id,
      user_id: p.user_id,
      username: p.username,
      cards_in_hand: p.cards_in_hand,
      player_order: p.player_order,
    })),
    topDiscard,
    handsByPlayerId,
  };
}

export function initializeGameHandlers(socket: GameSocket, io: Server): void {

  // ---------------------------
  // GAME_JOINED
  // ---------------------------
  socket.on(GAME_JOINED, async ({ gameId }) => {
    if (!Number.isFinite(gameId)) {
      socket.emit(GAME_ERROR, { message: "Invalid game ID" });
      return;
    }

    const players = await findGameRoomPlayersByGameRoom(gameId);
    const me = players.find(p => Number(p.user_id) === socket.userId);

    if (!me) {
      socket.emit(GAME_ERROR, { message: "You are not in this game" });
      return;
    }

    socket.join(`game:${gameId}`);
    socket.currentGameRoomId = gameId;

    console.log(`[game] ${socket.username} joined game ${gameId}`);
  });

  // ---------------------------
  // GAME_DRAW
  // ---------------------------

  socket.on(GAME_DRAW, async ({ gameId }) => {
    try {
      await drawCardForPlayer(gameId, socket.userId);

      const state = await buildGameState(gameId);
      io.to(`game:${gameId}`).emit(GAME_STATE, state);
    } catch (err) {
      console.error("[game] Error drawing card:", err);
      socket.emit(GAME_ERROR, { message: "Cannot draw card" });
    }
  });

    // ---------------------------
    // GAME_PLAY
    // ---------------------------

    socket.on(GAME_PLAY, async ({ gameId, deckCardId, chosenColor }) => {
      try {
        console.log(
          `[game] Player ${socket.username} attempting to play card ${deckCardId} in game ${gameId} (chosenColor=${chosenColor})`
        );

        const result = await playCard(gameId, socket.userId, deckCardId, chosenColor);

        if (result?.winnerId) {
          const gameResult = await findGameResultByGameRoom(gameId);
          if (gameResult) {
            const rankings = await findGameResultPlayersByGameResult(gameResult.id);
            io.to(`game:${gameId}`).emit(GAME_OVER, {
              winnerId: result.winnerId,
              rankings: rankings,
            });
          }

          return;
        }

        const state = await buildGameState(gameId);
        io.to(`game:${gameId}`).emit(GAME_STATE, state);
      } catch (err) {
        console.error("[game] Error playing card:", err);
        socket.emit(GAME_ERROR, { message: "Invalid card play" });
      }
    });

    socket.on("game:close", async ({ gameId }) => {
        await deleteGameRoom(gameId);
        io.to(`game:${gameId}`).emit("game:closed");
    });


}