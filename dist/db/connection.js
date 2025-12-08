"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const pg_promise_1 = __importDefault(require("pg-promise"));
(0, dotenv_1.configDotenv)();
const pgp = (0, pg_promise_1.default)();
const connectionString = process.env.DATABASE_URL;
if (connectionString === undefined) {
    throw new Error("DATABASE_URL is not available in environment");
}
const db = pgp(connectionString);
exports.default = db;
