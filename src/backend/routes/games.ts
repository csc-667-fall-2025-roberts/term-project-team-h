import express from "express";
import * as Auth from "../db/auth";
import { requireUser } from "../middleware";


import db from "../db/connection";
import { findGameRoomById } from "@backend/db/lobby";
import { findGameRoomDecksByLocation, findGameRoomDecksByPlayer, findGameRoomPlayersByGameRoom, findUnoCardById } from "@backend/db/game";




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

    // To display current players deck 
    const myCards = await findGameRoomDecksByPlayer(gameId, me.id);
    

    // To display the top card in the discard pile
    const discardPile = await findGameRoomDecksByLocation(gameId,"discard");
    
    const topDiscard =
    discardPile.length > 0
    ? discardPile[discardPile.length - 1]
    : null;

    
    res.render("game", {
      gameId,
      room,
      players,
      me,
      myCards,
      topDiscard,
    });
    
  
  }catch (err){
    next(err);
  }

});

export { router as gamesRouter} ;


