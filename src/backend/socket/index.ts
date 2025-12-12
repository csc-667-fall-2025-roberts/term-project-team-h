import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { SessionData } from "express-session";
import { RequestHandler } from "express";
import { initializeChatHandlers, ChatSocket } from "./chat";

export function initializeSockets(
  httpServer: HTTPServer,
  sessionMiddleware: RequestHandler
): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.ALLOWED_ORIGIN || true
          : ["http://localhost:3000", "http://localhost:3001"],
      credentials: true,
    },
  });

  io.engine.use(sessionMiddleware as any);

  io.on("connection", (socket: any) => {
    const session = socket.request.session as SessionData;

    if (!session || !session.user) {
      socket.disconnect();
      return;
    }

    socket.userId = session.user.id;
    socket.username = session.user.username;

    console.log(`Socket connection established for user ${socket.username} (ID: ${socket.userId})`);

    initializeChatHandlers(socket as ChatSocket);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected for user ${socket.username} (ID: ${socket.userId})`);
    });
  });

  return io;
}

