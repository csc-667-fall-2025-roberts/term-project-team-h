import { ChatManager } from "./chat";
import { GLOBAL_ROOM } from "@shared/keys";
import { initializeWaitingRoom } from "./waitingRoom";

declare global {
  interface Window {
    ChatManager: typeof ChatManager;
    GLOBAL_ROOM: string;
    __chatInitialized?: boolean;
  }
}

window.ChatManager = ChatManager;
window.GLOBAL_ROOM = GLOBAL_ROOM;

function initializeChat() {
  // Use window property to persist across multiple script loads
  if ((window as any).__chatInitialized) {
    console.log("Chat already initialized, skipping...");
    return;
  }

  const chatSection = document.querySelector(".chat-section");
  if (!chatSection) return;

  const roomType = chatSection.getAttribute("data-room-type");
  if (!roomType) return;

  const messageContainer = chatSection.querySelector(
    "#chat-messages"
  ) as HTMLElement | null;
  const messageInput = chatSection.querySelector(
    "#chat-input-field"
  ) as HTMLInputElement | null;
  const sendButton = chatSection.querySelector(
    "#chat-form button[type='submit']"
  ) as HTMLButtonElement | null;

  if (!messageContainer || !messageInput || !sendButton) {
    console.error("Chat: Required elements not found");
    return;
  }

  let roomId: number | string;

  if (roomType === "lobby") {
    roomId = GLOBAL_ROOM;
  } else if (roomType === "game") {
    const roomIdAttr = chatSection.getAttribute("data-game-room-id");
    if (!roomIdAttr) {
      console.error("Chat: data-game-room-id not found");
      return;
    }
    roomId = Number(roomIdAttr);
    if (!Number.isFinite(roomId)) {
      console.error("Chat: Invalid room ID");
      return;
    }
  } else {
    console.error("Chat: Unknown room type");
    return;
  }

  const chatManager = new ChatManager();
  chatManager.initialize(roomId, {
    messageContainer,
    messageInput,
    sendButton,
  });

  (window as any).__chatInitialized = true;
}

function bootstrap() {
  initializeChat();
  initializeWaitingRoom();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
