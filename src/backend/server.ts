import * as path from "path";
import express from "express";
import morgan from "morgan";
import createHttpError from "http-errors";
import { createServer } from "http";

import { sessionMiddleware } from "./config/session";
import { requireUser } from "./middleware";
import { lobbyRoutes } from "./routes/lobby";
import { authRoutes } from "./routes/auth";
import { waitingRoomRoutes } from "./routes/waiting_room";
import { gamesRouter } from "./routes/games";
import { chatRoutes } from "./routes/chat";

import { initializeSockets } from "./socket";

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
  console.log("[SERVER] Trust proxy enabled for production");
}

app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(sessionMiddleware);

app.use("/lobby", requireUser, lobbyRoutes);
app.use("/auth", authRoutes);
app.use("/waiting_room", waitingRoomRoutes);
app.use("/games", gamesRouter);
app.use("/chat", chatRoutes);

app.get("/", (_request, response) => {
  response.render("root");
});

app.use((_request, response, next) => {
  next(response.render("HTTPError", { error: "Page Not Found"}));
});

const io = initializeSockets(httpServer, sessionMiddleware as any);
app.set("io", io);

httpServer.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
