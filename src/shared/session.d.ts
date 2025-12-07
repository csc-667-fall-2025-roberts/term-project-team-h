import "express-session";
import type { User } from "@shared/types";

declare module "express-session" {
  interface SessionData {
    user?: User;
  }
}

