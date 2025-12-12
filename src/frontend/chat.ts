import { io, Socket } from "socket.io-client";
import type { ChatMessageWithUsername } from "@shared/types";
import { CHAT_LISTING, CHAT_MESSAGE, GLOBAL_ROOM } from "@shared/keys";

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
    if (this.roomId === GLOBAL_ROOM) {
      fetch("/chat", {
        method: "GET",
        credentials: "include",
      }).catch((error) => {
        console.error("Error loading messages:", error);
      });
      return;
    }

    try {
      const response = await fetch(`/chat/${this.roomId}`, {
        method: "GET",
        credentials: "include",
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

