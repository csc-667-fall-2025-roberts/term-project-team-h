"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = __importDefault(require("express"));
const connection_1 = __importDefault(require("../db/connection"));
const router = express_1.default.Router();
exports.userRoutes = router;
router.get("/", async (_request, response) => {
    const userListing = await connection_1.default.manyOrNone("SELECT id, email, username FROM users");
    response.render("user_listing", { userListing });
});
router.post("/", async (request, response) => {
    const { username, email } = request.body;
    const result = connection_1.default.one("INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email", [username, email, "some-password"]);
    response.redirect("/users");
});
router.get("/:id", async (request, response) => {
    const { id } = request.params;
    const user = await connection_1.default.oneOrNone("SELECT id, username, email FROM users WHERE id=$1", [id]);
    response.render("user", user);
});
