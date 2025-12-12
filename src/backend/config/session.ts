import connectPgSimple from "connect-pg-simple";
import session from "express-session";

import db from "../db/connection";

const PgSession = connectPgSimple(session);

const sessionConfig = {
  store: new PgSession({
    // @ts-ignore
    pool: db.$pool,
    tableName: "session",
  }),
  secret: process.env.SESSION_SECRET || "this should not be used",
  resave: false,
  saveUninitialized: false,
  name: "connect.sid", // Explicit session cookie name
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const, // Use "lax" for same-site cookies (frontend and backend on same domain)
  },
};

if (process.env.NODE_ENV === "production") {
  console.log("[SESSION] Production mode - secure cookies enabled");
  console.log("[SESSION] SameSite set to 'lax'");
  console.log("[SESSION] Cookie name: connect.sid");
}

export const sessionMiddleware = session(sessionConfig);

