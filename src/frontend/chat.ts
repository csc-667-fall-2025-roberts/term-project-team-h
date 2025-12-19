import { io, Socket } from "socket.io-client";
import type { ChatMessageWithUsername } from "@shared/types";
import { CHAT_LISTING, CHAT_MESSAGE, GLOBAL_ROOM } from "@shared/keys";

declare global {
  interface Window {
    ChatManager: typeof ChatManager;
    GLOBAL_ROOM: string;
    __chatInitialized?: boolean;
  }
}

export class ChatManager {
  private socket: Socket | null = null;
  private roomId: number | string | null = null;
  private messageContainer: HTMLElement | null = null;
  private messageInput: HTMLInputElement | null = null;
  private sendButton: HTMLButtonElement | null = null;
  private formHandlersSetup: boolean = false;
  private socketListenersSetup: boolean = false;

  initialize(roomId: number | string, options: {
    messageContainer: HTMLElement | string;
    messageInput: HTMLInputElement | string;
    sendButton: HTMLButtonElement | string;
  }): void {
    // Clean up existing socket if re-initializing
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // Reset flags
    this.formHandlersSetup = false;
    this.socketListenersSetup = false;

    this.roomId = roomId;

    this.messageContainer = typeof options.messageContainer === "string"
      ? document.querySelector(options.messageContainer) as HTMLElement
      : options.messageContainer;

    this.messageInput = typeof options.messageInput === "string"
      ? document.querySelector(options.messageInput) as HTMLInputElement
      : options.messageInput;

    this.sendButton = typeof options.sendButton === "string"
      ? document.querySelector(options.sendButton) as HTMLButtonElement
      : options.sendButton;

    if (!this.messageContainer || !this.messageInput || !this.sendButton) {
      console.error("Chat: Required DOM elements not found");
      return;
    }

    this.socket = io({
      withCredentials: true,
    });

    this.setupSocketListeners();

    this.setupFormHandlers();

    this.socket.emit("join-room", { roomId: roomId });

    this.loadMessageHistory();
  }

  private setupSocketListeners(): void {
    if (!this.socket || this.socketListenersSetup) return;

    this.socket.on(CHAT_LISTING, (data: { messages: ChatMessageWithUsername[] }) => {
      if (this.messageContainer) {
        this.messageContainer.innerHTML = "";
        data.messages.forEach((msg) => {
          this.appendMessage(msg);
        });
      }
    });

    this.socket.on(CHAT_MESSAGE, (message: ChatMessageWithUsername) => {
      this.appendMessage(message);
    });

    this.socket.on("chat-error", (data: { message: string }) => {
      console.error("Chat error:", data.message);
    });

    this.socketListenersSetup = true;
  }

  private setupFormHandlers(): void {
    if (!this.messageInput || !this.sendButton || this.formHandlersSetup) return;

    const form = this.messageInput.closest("form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.sendMessage();
      });
    }

    this.sendButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    this.messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.formHandlersSetup = true;
  }

  private async sendMessage(): Promise<void> {
    if (!this.messageInput) return;

    const message = this.messageInput.value.trim();
    if (message.length === 0) return;

    try {
      const url = this.roomId === GLOBAL_ROOM ? "/chat" : `/chat/${this.roomId}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to send message:", error.error);
        return;
      }

      this.messageInput.value = "";
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  private async loadMessageHistory(): Promise<void> {
    try {
      const url = this.roomId === GLOBAL_ROOM 
        ? "/chat?limit=100" 
        : `/chat/${this.roomId}?limit=100`;
      
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Failed to load messages");
        return;
      }

      const data = await response.json();
      if (data.messages && Array.isArray(data.messages)) {
        if (this.messageContainer) {
          this.messageContainer.innerHTML = "";
        }

        data.messages.forEach((msg: ChatMessageWithUsername) => {
          this.appendMessage(msg);
        });
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }

  private appendMessage(message: ChatMessageWithUsername): void {
    if (!this.messageContainer) return;

    const messageElement = document.createElement("div");
    messageElement.className = "message";

    const usernameSpan = document.createElement("span");
    usernameSpan.className = "message-user";
    usernameSpan.textContent = `${message.username}: `;

    const textSpan = document.createElement("span");
    textSpan.className = "message-text";
    textSpan.textContent = message.message;

    messageElement.appendChild(usernameSpan);
    messageElement.appendChild(textSpan);

    this.messageContainer.appendChild(messageElement);

    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
  }
}

export function initializeChat(): void {
  // Use window property to persist across multiple script loads
  if (window.__chatInitialized) {
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

  window.__chatInitialized = true;
}

// Set up window globals for backward compatibility if needed
if (typeof window !== "undefined") {
  window.ChatManager = ChatManager;
  window.GLOBAL_ROOM = GLOBAL_ROOM;
}

