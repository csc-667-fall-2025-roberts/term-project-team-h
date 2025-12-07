import express from "express";
import * as Auth from "../db/auth";
import { requireGuest } from "../middleware";

const router = express.Router();

router.get("/login", requireGuest, async (_request, response) => {
  response.render("login", {});
});

router.post("/login", requireGuest, async (request, response) => {
  const { username, password } = request.body;

  try {
    const user = await Auth.login(username, password);

    request.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
    };

    response.redirect("/lobby");
  } catch (error: any) {

    response.render("login", { error: error.message });
  }
});

router.get("/register", requireGuest, async (_request, response) => {
  response.render("register", {});
});

router.post("/register", requireGuest, async (request, response) => {
  const { username, email, password } = request.body;

  try {
    const user = await Auth.signup(username, email, password);

    request.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
    };

    response.redirect("/lobby");
  } catch (error: any) {
    response.render("register", { error: error.message });
  }
});

router.post("/logout", async (request, response) => {

  await new Promise<void>((resolve, reject) => {
    request.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        reject(err);
      } else {
        console.log("Session destroyed successfully");
        resolve();
      }
    });
  }).catch((error) => {
    console.error("Error in logout promise:", error);
  });

  response.redirect("/");
});

export { router as authRoutes };