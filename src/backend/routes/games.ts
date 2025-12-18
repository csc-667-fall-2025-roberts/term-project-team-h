import express from "express";
import * as Auth from "../db/auth";
import { requireUser } from "../middleware";


import db from "../db/connection";
import { findGameRoomById } from "@backend/db/lobby";
import { createGameTurn, drawTopDeckCard, findGameRoomDecksByLocation, findGameRoomDecksByPlayer, findGameRoomPlayersByGameRoom, findUnoCardById, giveCardToPlayer, playCard, getTopDiscardCard, GameRoomPlayerWithUsername, getCurrentPlayer } from "@backend/db/game";
import { nextTick } from "process";




const router = express.Router();

router.get("/:id", requireUser, async (req, res, next) => {

  try {

    if (!req.session || !req.session.user) {
      return res.redirect("/login");
    }

    const gameId = Number(req.params.id);
    const userId = req.session.user.id;
  
    const room = await findGameRoomById(gameId);
    
    if (!room){
      return res.redirect("/lobby");
    }

    const players = await findGameRoomPlayersByGameRoom(gameId);

    const me = players.find((p) => Number(p.user_id) === userId);

    if (!me){
      return res.redirect("/lobby");
    }

    /**
     *  For displaying other players in order
     */

    const sortedPlayers = players.sort((a,b) => (a.player_order ?? 0) - (b.player_order ?? 0));
    
    const myIndex = sortedPlayers.findIndex(p => p.id === me.id);

    const totalPlayers = sortedPlayers.length;
    type PlayerOrNull = GameRoomPlayerWithUsername | null;
    let positions: {
      top: PlayerOrNull, 
      left: PlayerOrNull,
      right: PlayerOrNull,
      bottom: GameRoomPlayerWithUsername,
    } = {
      top: null,
      left: null,
      right: null,
      bottom: me,
    };

    if (totalPlayers === 2){
      const topIndex = (myIndex + 1) % totalPlayers;
      positions.top = sortedPlayers[topIndex];
    
    }else if (totalPlayers === 3){
        positions.right = sortedPlayers[(myIndex + 1) % totalPlayers];
        positions.left = sortedPlayers[(myIndex + 2) % totalPlayers];
    
    }else if (totalPlayers === 4){
        positions.right = sortedPlayers[(myIndex + 1) % totalPlayers];
        positions.top = sortedPlayers[(myIndex + 2) % totalPlayers];
        positions.left = sortedPlayers[(myIndex + 3) % totalPlayers];
    }


    // To display current players deck 
    const myCards = await findGameRoomDecksByPlayer(gameId, me.id);
    

    // To display the top card in the discard pile
    const discardPile = await findGameRoomDecksByLocation(gameId,"discard");

    // To get the current player for turn displaying 
    const currentPlayer = await getCurrentPlayer(gameId);

    // const playerCards = await findGameRoomDecksByLocation(gameId,id);
    
    const topDiscard =
    discardPile.length > 0
    ? discardPile[discardPile.length - 1]
    : null;

    res.render("game", {
      gameId,
      room,
      players: sortedPlayers,
      positions,
      me,
      myCards,
      topDiscard,
      currentPlayer,
    });
    
  
  }catch (err){
    next(err);
  }

});


export { router as gamesRouter} ;


