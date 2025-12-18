import { initializeChat } from "./chat";
import { initializeWaitingRoom } from "./waitingRoom";
import { initializeLobbyPage } from "./lobby";
import { initializeGame } from "./game";

function bootstrap() {
  initializeChat();
  initializeWaitingRoom();
  initializeLobbyPage();
  initializeGame();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
