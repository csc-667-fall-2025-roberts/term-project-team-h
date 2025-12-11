import express from "express";
import * as Auth from "../db/auth";
import { requireUser } from "../middleware";

const router = express.Router();

router.get("/:id", requireUser, (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect("/login");
  }
  
  const { id } = req.params;
  res.render("game", { gameId: id });
});

export { router as gamesRouter} ;