"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get("/", (request, response) => {
    response.render("root", { gamesListing: ["a", "b", "c", "etc"] });
});
router.post("/", (request, response) => {
    response.send("you posted");
});
exports.default = router;
