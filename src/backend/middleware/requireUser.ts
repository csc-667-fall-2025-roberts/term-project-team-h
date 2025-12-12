import { NextFunction, Request, Response } from "express";

const requireUser = (request: Request, response: Response, next: NextFunction) => {
  console.log(`[REQUIRE_USER] Checking session for path: ${request.path}`);
  console.log(`[REQUIRE_USER] Session ID: ${request.sessionID}`);
  console.log(`[REQUIRE_USER] Cookies received:`, request.headers.cookie);
  console.log(`[REQUIRE_USER] Session user:`, request.session.user);
  console.log(`[REQUIRE_USER] Session exists:`, !!request.session);
  
  if (request.session.user === undefined) {
    console.log(`[REQUIRE_USER] No user in session, redirecting to /auth/login`);
    console.log(`[REQUIRE_USER] Session ID was: ${request.sessionID}`);
    response.redirect("/auth/login");
    return;
  }

  console.log(`[REQUIRE_USER] User authenticated: ${request.session.user.username} (ID: ${request.session.user.id})`);
  next();
};

export default requireUser;

