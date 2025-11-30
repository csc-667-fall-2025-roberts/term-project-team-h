import * as path from "path";
import express from "express";
import morgan from "morgan";
import createHttpError from "http-errors";

import rootRoutes from "./routes/root";
import { testRouter } from "./routes/test";
import { lobbyRoutes } from "./routes/lobby";
import { loginRoutes } from "./routes/login";
import { registerRoutes } from "./routes/register";

const app = express();

const PORT = process.env.PORT || 3001;

app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use("/", rootRoutes);
app.use("/test", testRouter);
app.use("/lobby", lobbyRoutes);
app.use("/login", loginRoutes);
app.use("/register", registerRoutes);

app.use((_request, _response, next) => {
  next(createHttpError(404));
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});