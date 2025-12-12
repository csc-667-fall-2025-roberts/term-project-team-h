import express from "express";
import * as Auth from "../db/auth";
import { requireGuest } from "../middleware";

const router = express.Router();

router.get("/login", requireGuest, async (_request, response) => {
  response.render("login", {});
});

router.post("/login", requireGuest, async (request, response) => {
  const { username, password } = request.body;

  console.log(`[LOGIN] Attempting login for username: ${username}`);

  try {
    const user = await Auth.login(username, password);
    console.log(`[LOGIN] Authentication successful for user ID: ${user.id}, username: ${user.username}`);

    request.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
    };

    // Explicitly save the session before redirecting
    await new Promise<void>((resolve, reject) => {
      request.session.save((err) => {
        if (err) {
          console.error("[LOGIN] Error saving session:", err);
          reject(err);
        } else {
          console.log(`[LOGIN] Session saved successfully for user ID: ${user.id}`);
          console.log(`[LOGIN] Session ID: ${request.sessionID}`);
          console.log(`[LOGIN] Cookie will be set: ${response.getHeader("Set-Cookie") || "none"}`);
          resolve();
        }
      });
    });

    console.log(`[LOGIN] Redirecting to /lobby for user ID: ${user.id}, Session ID: ${request.sessionID}`);
    response.redirect("/lobby");
  } catch (error: any) {
    console.error(`[LOGIN] Login failed for username: ${username}`, error.message);
    response.render("login", { error: error.message });
  }
});

router.get("/register", requireGuest, async (_request, response) => {
  response.render("register", {});
});

router.post("/register", requireGuest, async (request, response) => {
  const { username, email, password } = request.body;

  console.log(`[REGISTER] Attempting registration for username: ${username}, email: ${email}`);

  try {
    const user = await Auth.signup(username, email, password);
    console.log(`[REGISTER] Registration successful for user ID: ${user.id}, username: ${user.username}`);

    request.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
    };

    // Explicitly save the session before redirecting
    await new Promise<void>((resolve, reject) => {
      request.session.save((err) => {
        if (err) {
          console.error("[REGISTER] Error saving session:", err);
          reject(err);
        } else {
          console.log(`[REGISTER] Session saved successfully for user ID: ${user.id}`);
          resolve();
        }
      });
    });

    console.log(`[REGISTER] Redirecting to /lobby for user ID: ${user.id}`);
    response.redirect("/lobby");
  } catch (error: any) {
    console.error(`[REGISTER] Registration failed for username: ${username}`, error.message);
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