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
    findGameResultByGameRoom,
    findGameResultPlayersByGameResult,
} from "@backend/db/game"

export interface GameSocket extends Socket {
    userId: number;
    username: string;
    currentGameRoomId?: number;
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

        io.to(`game:${gameId}`).emit(GAME_STATE, {gameId});

    }catch (err){
        socket.emit(GAME_ERROR, {message: "Cannot draw card" });
    }

  });

    // ---------------------------
    // GAME_PLAY
    // ---------------------------

    socket.on(GAME_PLAY, async ({ gameId, deckCardId}) => {

        try {
            console.log(`[game] Player ${socket.username} attempting to play card ${deckCardId} in game ${gameId}`);

            const result = await playCard(gameId,socket.userId,deckCardId);

            if (result?.winnerId){

                const gameResult = await findGameResultByGameRoom(gameId);
                if (gameResult){
                    const rankings = await findGameResultPlayersByGameResult(gameResult.id);
                    io.to(`game:${gameId}`).emit(GAME_OVER, {
                        winnerId: result.winnerId,
                        rankings: rankings,
                    });
                }

                return;
            }

            io.to(`game:${gameId}`).emit(GAME_STATE, {gameId});

        }catch (err){
            console.error("[game] Error playing card:", err);
            socket.emit(GAME_ERROR, { message: "Invalid card play"});
        }
    });


    socket.on("game:close", async ({ gameId }) => {
        await deleteGameRoom(gameId);
        io.to(`game:${gameId}`).emit("game:closed");
    });


}