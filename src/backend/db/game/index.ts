/**
 * Game database operations
 */

import db from "../connection";
import {
  gameRoomQueries,
  gameRoomPlayerQueries,
  unoCardQueries,
  gameRoomDeckQueries,
  gameTurnQueries,
  gameResultQueries,
  gameResultPlayerQueries,
} from "./sql";

// Game Room Types
export interface GameRoom {
  id: number;
  title: string | null;
  max_players: number;
  password: string | null;
  status: "waiting" | "in_progress" | "finished";
  created_by: number;
  created_at: Date;
  started_at: Date | null;
  ended_at: Date | null;
  turn_direction: number;
  current_color: string | null;
}

export interface CreateGameRoomData {
  title?: string;
  max_players?: number;
  password?: string;
  status?: "waiting" | "in_progress" | "finished";
  created_by: number;
  current_color?: string | null;
}

// Game Room Player Types
export interface GameRoomPlayer {
  id: number;
  user_id: number;
  game_room_id: number;
  is_host: boolean;
  player_order: number | null;
  cards_in_hand: number;
  joined_at: Date;
}

export interface GameRoomPlayerWithUsername extends GameRoomPlayer {
  username: string;
}

export interface CreateGameRoomPlayerData {
  user_id: number;
  game_room_id: number;
  is_host?: boolean;
  player_order?: number;
}

// Uno Card Types
export interface UnoCard {
  id: number;
  color: "red" | "blue" | "green" | "yellow" | "wild";
  value: string;
}

// Game Room Deck Types
export interface GameRoomDeck {
  id: number;
  game_room_id: number;
  card_id: number;
  location: "deck" | "discard" | "player_hand";
  held_by_player_id: number | null;
  position_index: number | null;
}

export interface CreateGameRoomDeckData {
  game_room_id: number;
  card_id: number;
  location: "deck" | "discard" | "player_hand";
  held_by_player_id?: number;
  position_index?: number;
}

// Game Turn Types
export interface GameTurn {
  id: number;
  game_room_id: number;
  player_id: number;
  card_played_id: number | null;
  action_type: "play" | "draw" | "skip" | "reverse" | "draw_two" | "wild";
  created_at: Date;
}

export interface GameTurnWithUsername extends GameTurn {
  username: string;
}

export interface CreateGameTurnData {
  game_room_id: number;
  player_id: number;
  card_played_id?: number;
  action_type: "play" | "draw" | "skip" | "reverse" | "draw_two" | "wild";
}

// Game Result Types
export interface GameResult {
  id: number;
  game_room_id: number;
  winner_id: number | null;
  total_turns: number | null;
  created_at: Date;
}

export interface CreateGameResultData {
  game_room_id: number;
  winner_id?: number;
  total_turns?: number;
}

// Game Result Player Types
export interface GameResultPlayer {
  id: number;
  game_result_id: number;
  user_id: number;
  rank: number;
  cards_left: number;
}

export interface GameResultPlayerWithUsername extends GameResultPlayer {
  username: string;
}

export interface CreateGameResultPlayerData {
  game_result_id: number;
  user_id: number;
  rank: number;
  cards_left?: number;
}

// Game Room Functions
export async function findGameRoomById(id: number): Promise<GameRoom | null> {
  const room = await db.oneOrNone<GameRoom>(gameRoomQueries.findById, [id]);
  return room;
}

export async function findGameRoomsByStatus(
  status: "waiting" | "in_progress" | "finished"
): Promise<GameRoom[]> {
  const rooms = await db.manyOrNone<GameRoom>(gameRoomQueries.findByStatus, [status]);
  return rooms || [];
}

export async function findGameRoomsByHost(userId: number): Promise<GameRoom[]> {
  const rooms = await db.manyOrNone<GameRoom>(gameRoomQueries.findByHost, [userId]);
  return rooms || [];
}

export async function createGameRoom(data: CreateGameRoomData): Promise<GameRoom> {
  // NOTE: gameRoomQueries.create should have columns that default current_color to NULL
  const room = await db.one<GameRoom>(
    gameRoomQueries.create,
    [
      data.title || null,
      data.max_players || 4,
      data.password || null,
      data.status || "waiting",
      data.created_by,
    ]
  );
  return room;
}

export async function updateGameRoom(
  id: number,
  data: Partial<CreateGameRoomData> & {
    started_at?: Date | null;
    ended_at?: Date | null;
    turn_direction?: number;
    current_color?: string | null;
  }
): Promise<GameRoom | null> {
  const room = await db.oneOrNone<GameRoom>(
    gameRoomQueries.update,
    [
      data.title ?? null,
      data.max_players ?? null,
      data.password ?? null,
      data.status ?? null,
      data.started_at ?? null,
      data.ended_at ?? null,
      data.turn_direction ?? null,
      data.current_color ?? null,
      id,
    ]
  );
  return room;
}

export async function deleteGameRoom(id: number): Promise<boolean> {
  const result = await db.result(gameRoomQueries.delete, [id]);
  return result.rowCount > 0;
}

export async function listGameRooms(): Promise<GameRoom[]> {
  const rooms = await db.manyOrNone<GameRoom>(gameRoomQueries.list);
  return rooms || [];
}

// Game Room Player Functions
export async function findGameRoomPlayerById(id: number): Promise<GameRoomPlayer | null> {
  const player = await db.oneOrNone<GameRoomPlayer>(gameRoomPlayerQueries.findById, [id]);
  return player;
}

export async function findGameRoomPlayersByGameRoom(
  gameRoomId: number
): Promise<GameRoomPlayerWithUsername[]> {
  const players = await db.manyOrNone<GameRoomPlayerWithUsername>(
    gameRoomPlayerQueries.findByGameRoom,
    [gameRoomId]
  );
  return players || [];
}

export async function findGameRoomPlayersByUser(userId: number): Promise<GameRoomPlayer[]> {
  const players = await db.manyOrNone<GameRoomPlayer>(
    gameRoomPlayerQueries.findByUser,
    [userId]
  );
  return players || [];
}

export async function findGameRoomPlayerByGameRoomAndUser(
  gameRoomId: number,
  userId: number
): Promise<GameRoomPlayer | null> {
  const player = await db.oneOrNone<GameRoomPlayer>(
    gameRoomPlayerQueries.findByGameRoomAndUser,
    [gameRoomId, userId]
  );
  return player;
}

export async function createGameRoomPlayer(
  data: CreateGameRoomPlayerData
): Promise<GameRoomPlayer> {
  const player = await db.one<GameRoomPlayer>(
    gameRoomPlayerQueries.create,
    [data.user_id, data.game_room_id, data.is_host || false, data.player_order || null]
  );
  return player;
}

export async function updateGameRoomPlayer(
  id: number,
  data: Partial<Pick<GameRoomPlayer, "is_host" | "player_order" | "cards_in_hand">>
): Promise<GameRoomPlayer | null> {
  const player = await db.oneOrNone<GameRoomPlayer>(
    gameRoomPlayerQueries.update,
    [data.is_host, data.player_order, data.cards_in_hand, id]
  );
  return player;
}

export async function deleteGameRoomPlayer(id: number): Promise<boolean> {
  const result = await db.result(gameRoomPlayerQueries.delete, [id]);
  return result.rowCount > 0;
}

export async function deleteGameRoomPlayersByGameRoom(gameRoomId: number): Promise<number> {
  const result = await db.result(gameRoomPlayerQueries.deleteByGameRoom, [gameRoomId]);
  return result.rowCount;
}

// Uno Card Functions
export async function findUnoCardById(id: number): Promise<UnoCard | null> {
  const card = await db.oneOrNone<UnoCard>(unoCardQueries.findById, [id]);
  return card;
}

export async function findUnoCardsByColor(
  color: "red" | "blue" | "green" | "yellow" | "wild"
): Promise<UnoCard[]> {
  const cards = await db.manyOrNone<UnoCard>(unoCardQueries.findByColor, [color]);
  return cards || [];
}

export async function findUnoCardsByValue(value: string): Promise<UnoCard[]> {
  const cards = await db.manyOrNone<UnoCard>(unoCardQueries.findByValue, [value]);
  return cards || [];
}

export async function listUnoCards(): Promise<UnoCard[]> {
  const cards = await db.manyOrNone<UnoCard>(unoCardQueries.list);
  return cards || [];
}

// Game Room Deck Functions
export async function findGameRoomDeckById(id: number): Promise<GameRoomDeck | null> {
  const deck = await db.oneOrNone<GameRoomDeck>(gameRoomDeckQueries.findById, [id]);
  return deck;
}

export async function findGameRoomDecksByGameRoom(gameRoomId: number): Promise<GameRoomDeck[]> {
  const decks = await db.manyOrNone<GameRoomDeck>(
    gameRoomDeckQueries.findByGameRoom,
    [gameRoomId]
  );
  return decks || [];
}

export async function findGameRoomDecksByLocation(
  gameRoomId: number,
  location: "deck" | "discard" | "player_hand"
): Promise<GameRoomDeck[]> {
  const decks = await db.manyOrNone<GameRoomDeck>(
    gameRoomDeckQueries.findByLocation,
    [gameRoomId, location]
  );
  return decks || [];
}

export async function findGameRoomDecksByPlayer(
  gameRoomId: number,
  playerId: number
): Promise<GameRoomDeck[]> {
  const decks = await db.manyOrNone<GameRoomDeck>(
    gameRoomDeckQueries.findByPlayer,
    [gameRoomId, playerId]
  );
  return decks || [];
}

export async function createGameRoomDeck(data: CreateGameRoomDeckData): Promise<GameRoomDeck> {
  const deck = await db.one<GameRoomDeck>(
    gameRoomDeckQueries.create,
    [
      data.game_room_id,
      data.card_id,
      data.location,
      data.held_by_player_id || null,
      data.position_index ?? null,
    ]
  );
  return deck;
}

export async function updateGameRoomDeck(
  id: number,
  data: Partial<Pick<GameRoomDeck, "location" | "held_by_player_id" | "position_index">>
): Promise<GameRoomDeck | null> {
  const deck = await db.oneOrNone<GameRoomDeck>(
    gameRoomDeckQueries.update,
    [data.location, data.held_by_player_id, data.position_index, id]
  );
  return deck;
}

export async function deleteGameRoomDeck(id: number): Promise<boolean> {
  const result = await db.result(gameRoomDeckQueries.delete, [id]);
  return result.rowCount > 0;
}

export async function deleteGameRoomDecksByGameRoom(gameRoomId: number): Promise<number> {
  const result = await db.result(gameRoomDeckQueries.deleteByGameRoom, [gameRoomId]);
  return result.rowCount;
}

// Game Turn Functions
export async function findGameTurnById(id: number): Promise<GameTurn | null> {
  const turn = await db.oneOrNone<GameTurn>(gameTurnQueries.findById, [id]);
  return turn;
}

export async function findGameTurnsByGameRoom(
  gameRoomId: number
): Promise<GameTurnWithUsername[]> {
  const turns = await db.manyOrNone<GameTurnWithUsername>(
    gameTurnQueries.findByGameRoom,
    [gameRoomId]
  );
  return turns || [];
}

export async function createGameTurn(data: CreateGameTurnData): Promise<GameTurn> {
  const turn = await db.one<GameTurn>(
    gameTurnQueries.create,
    [data.game_room_id, data.player_id, data.card_played_id || null, data.action_type]
  );
  return turn;
}

export async function getLatestGameTurn(gameRoomId: number): Promise<GameTurn | null> {
  const turn = await db.oneOrNone<GameTurn>(gameTurnQueries.getLatest, [gameRoomId]);
  return turn;
}

export async function deleteGameTurn(id: number): Promise<boolean> {
  const result = await db.result(gameTurnQueries.delete, [id]);
  return result.rowCount > 0;
}

export async function deleteGameTurnsByGameRoom(gameRoomId: number): Promise<number> {
  const result = await db.result(gameTurnQueries.deleteByGameRoom, [gameRoomId]);
  return result.rowCount;
}

// Game Result Functions
export async function findGameResultById(id: number): Promise<GameResult | null> {
  const result = await db.oneOrNone<GameResult>(gameResultQueries.findById, [id]);
  return result;
}

export async function findGameResultByGameRoom(gameRoomId: number): Promise<GameResult | null> {
  const result = await db.oneOrNone<GameResult>(gameResultQueries.findByGameRoom, [gameRoomId]);
  return result;
}

export async function createGameResult(data: CreateGameResultData): Promise<GameResult> {
  const result = await db.one<GameResult>(
    gameResultQueries.create,
    [data.game_room_id, data.winner_id || null, data.total_turns || null]
  );
  return result;
}

export async function deleteGameResult(id: number): Promise<boolean> {
  const result = await db.result(gameResultQueries.delete, [id]);
  return result.rowCount > 0;
}

// Game Result Player Functions
export async function findGameResultPlayerById(id: number): Promise<GameResultPlayer | null> {
  const player = await db.oneOrNone<GameResultPlayer>(gameResultPlayerQueries.findById, [id]);
  return player;
}

export async function findGameResultPlayersByGameResult(
  gameResultId: number
): Promise<GameResultPlayerWithUsername[]> {
  const players = await db.manyOrNone<GameResultPlayerWithUsername>(
    gameResultPlayerQueries.findByGameResult,
    [gameResultId]
  );
  return players || [];
}

export async function createGameResultPlayer(
  data: CreateGameResultPlayerData
): Promise<GameResultPlayer> {
  const player = await db.one<GameResultPlayer>(
    gameResultPlayerQueries.create,
    [data.game_result_id, data.user_id, data.rank, data.cards_left || 0]
  );
  return player;
}

export async function deleteGameResultPlayer(id: number): Promise<boolean> {
  const result = await db.result(gameResultPlayerQueries.delete, [id]);
  return result.rowCount > 0;
}

export async function deleteGameResultPlayersByGameResult(gameResultId: number): Promise<number> {
  const result = await db.result(gameResultPlayerQueries.deleteByGameResult, [gameResultId]);
  return result.rowCount;
}

/**
 *  Function for starting the game
 */

export async function startGame(gameRoomId: number) {
  const players = await findGameRoomPlayersByGameRoom(gameRoomId);
  if (players.length === 0) {
    throw new Error("No players in game room");
  }

  const shuffledPlayers: typeof players = [];
  for (let i = 0; i < players.length; i++) {
    shuffledPlayers.push(players[i]);
  }

  for (let i = shuffledPlayers.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    const temp = shuffledPlayers[i];
    shuffledPlayers[i] = shuffledPlayers[randomIndex];
    shuffledPlayers[randomIndex] = temp;
  }

  const updatePromises = shuffledPlayers.map((player, newOrder) =>
    updateGameRoomPlayer(player.id, { player_order: newOrder })
  );
  await Promise.all(updatePromises);

  const allCards = await listUnoCards();
  const shuffled = allCards.sort(() => Math.random() - 0.5);

  // choose first discard by rotating specials to the back
  function isNumberCard(card: { value: string }) {
    return /^[0-9]+$/.test(card.value);
  }

  const deckQueue = [...shuffled]; // rotating specials
  let firstDiscardCard = null as (typeof shuffled[0]) | null;
  const SAFETY_LIMIT = deckQueue.length + 5;
  let cycles = 0;

  while (deckQueue.length > 0 && cycles < SAFETY_LIMIT) {
    const candidate = deckQueue.shift()!;
    if (isNumberCard(candidate)) {
      firstDiscardCard = candidate;
      break;
    } else {
      // rotate special to bottom
      deckQueue.push(candidate);
    }
    cycles++;
  }

  // fallback if no numeric card found
  if (!firstDiscardCard) {
    firstDiscardCard = deckQueue.shift() || shuffled[0];
  }

  // deal cards to players from the front of deckQueue
  const CARDS_PER_PLAYER = 7;

  for (const player of shuffledPlayers) {
    for (let i = 0; i < CARDS_PER_PLAYER; i++) {
      const cardToDeal = deckQueue.shift();
      if (!cardToDeal) throw new Error("Ran out of cards while dealing");
      await createGameRoomDeck({
        game_room_id: gameRoomId,
        card_id: cardToDeal.id,
        location: "player_hand",
        held_by_player_id: player.id,
        position_index: i,
      });
    }
    await updateGameRoomPlayer(player.id, {
      cards_in_hand: CARDS_PER_PLAYER,
    });
  }

  // remaining queue becomes the draw deck
  for (let i = 0; i < deckQueue.length; i++) {
    await createGameRoomDeck({
      game_room_id: gameRoomId,
      card_id: deckQueue[i].id,
      location: "deck",
      position_index: i,
    });
  }

  // put the chosen numeric first discard on top of discard pile
  await createGameRoomDeck({
    game_room_id: gameRoomId,
    card_id: firstDiscardCard.id,
    location: "discard",
    position_index: 0,
  });

  // determine effective color for the initial discard:
  let effectiveColor: "red" | "green" | "yellow" | "blue" = "red";
  if (firstDiscardCard.color && firstDiscardCard.color !== "wild") {
    effectiveColor = firstDiscardCard.color as typeof effectiveColor;
  } 
  else {
    const fallback = deckQueue.find((c) => c.color !== "wild" && isNumberCard(c));
    if (fallback && fallback.color) effectiveColor = fallback.color as typeof effectiveColor;
  }

  // update game room status and set current_color so canPlayCard works correctly
  await updateGameRoom(gameRoomId, {
    status: "in_progress",
    started_at: new Date(),
    turn_direction: 1,
    current_color: effectiveColor,
  });

  console.log("[startGame] Game initialized for room", gameRoomId);

  return { message: "Game started successfully" };
}


/**
 *  Function to get the top card in the discard pile
 */

export async function getTopDiscardCard(
  gameRoomId: number
): Promise<GameRoomDeck | null> {
  const cards = await db.oneOrNone<GameRoomDeck>(
    gameRoomDeckQueries.getTopDiscard,
    [gameRoomId]
  );
  return cards;
}

/**
 *  Function to draw the top card in the deck
 */

export async function drawTopDeckCard(
  gameRoomId: number
): Promise<GameRoomDeck | null> {
  const card = await db.oneOrNone<GameRoomDeck>(
    gameRoomDeckQueries.getTopDeckCard,
    [gameRoomId]
  );
  return card;
}

/**
 *  Function to get a players hand
 */

export async function getPlayerHand(
  gameRoomId: number,
  playerId: number
): Promise<GameRoomDeck[]> {
  const hand = await findGameRoomDecksByPlayer(gameRoomId, playerId);
  return hand;
}

/**
 *  Function to give a card to a player
 */

export async function giveCardToPlayer(
  deckCardId: number,
  playerId: number
): Promise<GameRoomDeck | null> {
  const updated = await updateGameRoomDeck(deckCardId, {
    location: "player_hand",
    held_by_player_id: playerId,
    position_index: null,
  });
  return updated;
}

/**
 *  Function to give the top card in the deck
 *  to the player that is drawing the card
 */

export async function drawCardForPlayer(
  gameRoomId: number,
  userId: number
) {
  const player = await findGameRoomPlayerByGameRoomAndUser(gameRoomId, userId);
  if (!player) {
    throw new Error("Player not found in game");
  }

  const currentPlayer = await getCurrentPlayer(gameRoomId);
  if (!currentPlayer || currentPlayer.id !== player.id) {
    throw new Error("It's not your turn!");
  }

  const topCard = await drawTopDeckCard(gameRoomId);
  if (!topCard) {
    throw new Error("Deck is empty");
  }

  const cardsInHand = await findGameRoomDecksByPlayer(gameRoomId, player.id);
  const nextHandPosition =
    cardsInHand.length === 0
      ? 0
      : Math.max(
          ...cardsInHand
            .map(c => c.position_index)
            .filter((p): p is number => p !== null)
        ) + 1;

  await updateGameRoomDeck(topCard.id, {
    location: "player_hand",
    held_by_player_id: player.id,
    position_index: nextHandPosition,
  });

  await updateGameRoomPlayer(player.id, {
    cards_in_hand: player.cards_in_hand + 1,
  });

  // Just log the draw
  await createGameTurn({
    game_room_id: gameRoomId,
    player_id: player.id,
    action_type: "draw",
  });
}

/**
 *  Function to play a card
 */
export async function playCard(
  gameRoomId: number,
  userId: number,
  deckCardId: number,
  chosenColor?: string
) {
  console.log("hello, chosenColor:", chosenColor);

  const player = await findGameRoomPlayerByGameRoomAndUser(gameRoomId, userId);
  if (!player) {
    throw new Error("Player not found");
  }

  console.log(`[playCard] Player ID: ${player.id}, User ID: ${userId}`);

  const currentPlayer = await getCurrentPlayer(gameRoomId);
  if (!currentPlayer || currentPlayer.id !== player.id) {
    throw new Error("It's not your turn!");
  }

  const deckCard = await findGameRoomDeckById(deckCardId);
  if (!deckCard) {
    throw new Error("Card not found");
  }

  console.log("[playCard] Deck Card:", deckCard);

  if (Number(deckCard.held_by_player_id) !== player.id) {
    throw new Error(
      `You do not have this card. Card held by: ${deckCard.held_by_player_id}, You are: ${player.id}`
    );
  }

  const unoCard = await findUnoCardById(deckCard.card_id);
  if (!unoCard) {
    throw new Error("Card not found");
  }

  const isWild = unoCard.value === "wild";
  const isWildDrawFour = unoCard.value === "wild_draw_four";

  // Wild / +4 must have a chosen color from the client
  if ((isWild || isWildDrawFour) && !chosenColor) {
    throw new Error("You must choose a color for this card.");
  }

  const normalizedColor = chosenColor
    ? (chosenColor.toLowerCase() as "red" | "green" | "yellow" | "blue")
    : undefined;

  // Color that should be in effect after this play
  const effectiveColor: "red" | "green" | "yellow" | "blue" =
    isWild || isWildDrawFour
      ? normalizedColor!
      : (unoCard.color as "red" | "green" | "yellow" | "blue");

  // Non-wild cards must obey color/number rules
  if (!isWild && !isWildDrawFour) {
    const isValidPlay = await canPlayCard(gameRoomId, deckCard.card_id);
    if (!isValidPlay) {
      throw new Error("This card cannot be played! Color or number must match.");
    }
  }

  const discardPile = await findGameRoomDecksByLocation(gameRoomId, "discard");
  const nextPosition = discardPile.length;

  await updateGameRoomDeck(deckCardId, {
    location: "discard",
    held_by_player_id: null,
    position_index: nextPosition,
  });

  await updateGameRoomPlayer(player.id, {
    cards_in_hand: player.cards_in_hand - 1,
  });

  // Set the active color for future plays
  await updateGameRoom(gameRoomId, {
    current_color: effectiveColor,
  });

  const win = await checkWinCondition(gameRoomId, player.id);
  if (win) {
    console.log("winner");
    return win;
  }

  // ==== SPECIAL CARDS ====

  if (unoCard.value === "draw_two") {
    const nextPlayer = await getNextPlayer(gameRoomId, player.id);
    if (!nextPlayer) throw new Error("Next player not found");

    await applyDrawTwo(gameRoomId, nextPlayer.id);

    await createGameTurn({
      game_room_id: gameRoomId,
      player_id: player.id,
      card_played_id: deckCard.card_id,
      action_type: "draw_two",
    });

    await createGameTurn({
      game_room_id: gameRoomId,
      player_id: nextPlayer.id,
      action_type: "skip",
    });

    return;
  }

  if (unoCard.value === "reverse") {
    const players = await findGameRoomPlayersByGameRoom(gameRoomId);

    const gameRoom = await findGameRoomById(gameRoomId);
    if (!gameRoom) {
      throw new Error("Game room not found");
    }

    const newDirection = gameRoom.turn_direction * -1;
    await updateGameRoom(gameRoomId, {
      turn_direction: newDirection,
    });

    await createGameTurn({
      game_room_id: gameRoomId,
      player_id: player.id,
      card_played_id: deckCard.card_id,
      action_type: "reverse",
    });

    if (players.length === 2) {
      const opponent = players.find(candidate => candidate.id !== player.id);
      if (opponent) {
        await createGameTurn({
          game_room_id: gameRoomId,
          player_id: opponent.id,
          action_type: "skip",
        });
      }
    }
    return;
  }

  if (unoCard.value === "skip") {
    const skippedPlayer = await getNextPlayer(gameRoomId, player.id);
    if (!skippedPlayer) {
      throw new Error("Skipped player not found");
    }

    await createGameTurn({
      game_room_id: gameRoomId,
      player_id: player.id,
      card_played_id: deckCard.card_id,
      action_type: "play",
    });

    await createGameTurn({
      game_room_id: gameRoomId,
      player_id: skippedPlayer.id,
      action_type: "skip",
    });

    return;
  }

  if (unoCard.value === "wild_draw_four") {
    const nextPlayer = await getNextPlayer(gameRoomId, player.id);
    if (!nextPlayer) throw new Error("Next player not found");

    await applyDrawFour(gameRoomId, nextPlayer.id);

    await createGameTurn({
      game_room_id: gameRoomId,
      player_id: player.id,
      card_played_id: deckCard.card_id,
      action_type: "wild", // keep enum happy
    });

    await createGameTurn({
      game_room_id: gameRoomId,
      player_id: nextPlayer.id,
      action_type: "skip",
    });

    return;
  }

  // plain wild (if you have it defined separately from wild_draw_four)
  if (unoCard.value === "wild") {
    await createGameTurn({
      game_room_id: gameRoomId,
      player_id: player.id,
      card_played_id: deckCard.card_id,
      action_type: "wild",
    });
    return;
  }

  await createGameTurn({
    game_room_id: gameRoomId,
    player_id: player.id,
    card_played_id: deckCard.card_id,
    action_type: "play",
  });
}

/**
 *  Function to enforce players turns
 */

export async function getCurrentPlayer(
  gameRoomId: number
): Promise<GameRoomPlayer | null> {
  const lastTurn = await getLatestGameTurn(gameRoomId);

  if (!lastTurn) {
    const players = await findGameRoomPlayersByGameRoom(gameRoomId);
    return (
      players.sort((a, b) => (a.player_order ?? 0) - (b.player_order ?? 0))[0] ??
      null
    );
  }
  const lastPlayer = await findGameRoomPlayerById(lastTurn.player_id);
  if (!lastPlayer) return null;

  return getNextPlayer(gameRoomId, lastPlayer.id);
}

/**
 * Function to get next player in turn order
 */

export async function getNextPlayer(
  gameRoomId: number,
  currentPlayerId: number
): Promise<GameRoomPlayer | null> {
  const players = await findGameRoomPlayersByGameRoom(gameRoomId);

  const ordered = players.sort(
    (a, b) => (a.player_order ?? 0) - (b.player_order ?? 0)
  );

  const index = ordered.findIndex(p => p.id === currentPlayerId);
  if (index === -1) return null;

  const gameRoom = await findGameRoomById(gameRoomId);
  if (!gameRoom) return null;
  const direction = gameRoom.turn_direction;

  const nextIndex = (index + direction + ordered.length) % ordered.length;

  return ordered[nextIndex];
}

/**
 * Function to validate if a card can be played
 */
export async function canPlayCard(
  gameRoomId: number,
  cardId: number
): Promise<boolean> {
  // Card being played
  const playedCard = await findUnoCardById(cardId);
  if (!playedCard) {
    return false;
  }

  // Wilds can always be played
  if (
    playedCard.value === "wild" ||
    playedCard.value === "wild_draw_four" ||
    playedCard.color === "wild"
  ) {
    return true;
  }

  // Top discard
  const topDiscard = await getTopDiscardCard(gameRoomId);
  if (!topDiscard) {
    // First move: allow any card
    return true;
  }

  const topDiscardCard = await findUnoCardById(topDiscard.card_id);
  if (!topDiscardCard) {
    return false;
  }

  // Get current active color from the game room, if set
  const gameRoom = await findGameRoomById(gameRoomId);
  const activeColor =
    (gameRoom?.current_color as string | null) ?? topDiscardCard.color;

  const colorMatches = playedCard.color === activeColor;
  const valueMatches = playedCard.value === topDiscardCard.value;

  console.log("[canPlayCard]", {
    played: { color: playedCard.color, value: playedCard.value },
    top: { color: topDiscardCard.color, value: topDiscardCard.value },
    activeColor,
    colorMatches,
    valueMatches,
  });

  return colorMatches || valueMatches;
}

async function applyDrawTwo(gameRoomId: number, targetPlayerId: number) {
  for (let i = 0; i < 2; i++) {
    const card = await drawTopDeckCard(gameRoomId);
    if (!card) throw new Error("Deck is empty");

    await updateGameRoomDeck(card.id, {
      location: "player_hand",
      held_by_player_id: targetPlayerId,
      position_index: null,
    });
  }

  const targetPlayer = await findGameRoomPlayerById(targetPlayerId);
  if (targetPlayer) {
    await updateGameRoomPlayer(targetPlayer.id, {
      cards_in_hand: targetPlayer.cards_in_hand + 2,
    });
  }
}

async function applyDrawFour(gameRoomId: number, targetPlayerId: number) {
  for (let i = 0; i < 4; i++) {
    const card = await drawTopDeckCard(gameRoomId);
    if (!card) throw new Error("Deck is empty");

    await updateGameRoomDeck(card.id, {
      location: "player_hand",
      held_by_player_id: targetPlayerId,
      position_index: null,
    });
  }

  const targetPlayer = await findGameRoomPlayerById(targetPlayerId);
  if (targetPlayer) {
    await updateGameRoomPlayer(targetPlayer.id, {
      cards_in_hand: targetPlayer.cards_in_hand + 4,
    });
  }
}

async function checkWinCondition(gameRoomId: number, playerId: number) {
  const player = await findGameRoomPlayerById(playerId);

  if (!player) {
    return null;
  }

  if (player.cards_in_hand === 0) {
    const result = await createGameResult({
      game_room_id: gameRoomId,
      winner_id: player.user_id,
    });

    const players = await findGameRoomPlayersByGameRoom(gameRoomId);

    const sorted = [...players].sort(
      (a, b) => a.cards_in_hand - b.cards_in_hand
    );

    for (let i = 0; i < sorted.length; i++) {
      await createGameResultPlayer({
        game_result_id: result.id,
        user_id: sorted[i].user_id,
        rank: i + 1,
        cards_left: sorted[i].cards_in_hand,
      });
    }

    await updateGameRoom(gameRoomId, {
      status: "finished",
      ended_at: new Date(),
    });

    return {
      winnerId: player.user_id,
    };
  }
  return null;
}