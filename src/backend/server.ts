import * as path from "path";
import express from "express";
import morgan from "morgan";
import createHttpError from "http-errors";

import { sessionMiddleware } from "./config/session";
import { requireUser } from "./middleware";
import { lobbyRoutes } from "./routes/lobby";
import { authRoutes } from "./routes/auth";
import { waitingRoomRoutes } from "./routes/waiting_room";

const app = express();

const PORT = process.env.PORT || 3001;

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


app.get("/", (_request, response) => {
  response.render("root");
});

app.get("/games/:id", requireUser, (request, response) => {
  const { id } = request.params;
  response.render("gamee", { gameId: id });
});

app.get("/og", (request, response) => {
  response.render("game");
});

app.use((_request, response, next) => {
  next(response.render("HTTPError", { error: "Page Not Found"}));
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
