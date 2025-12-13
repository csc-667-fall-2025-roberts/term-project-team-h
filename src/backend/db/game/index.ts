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
}

export interface CreateGameRoomData {
  title?: string;
  max_players?: number;
  password?: string;
  status?: "waiting" | "in_progress" | "finished";
  created_by: number;
}

// Game Room Player Types
export interface GameRoomPlayer {
  id: number;
  user_id: number;
  game_room_id: number;
  is_game_master: boolean;
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
  is_game_master?: boolean;
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
  owner_player_id: number | null;
  position_index: number | null;
}

export interface CreateGameRoomDeckData {
  game_room_id: number;
  card_id: number;
  location: "deck" | "discard" | "player_hand";
  owner_player_id?: number;
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

export async function findGameRoomsByCreator(userId: number): Promise<GameRoom[]> {
  const rooms = await db.manyOrNone<GameRoom>(gameRoomQueries.findByCreator, [userId]);
  return rooms || [];
}

export async function createGameRoom(data: CreateGameRoomData): Promise<GameRoom> {
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
  }
): Promise<GameRoom | null> {
  const room = await db.oneOrNone<GameRoom>(
    gameRoomQueries.update,
    [
      data.title,
      data.max_players,
      data.password,
      data.status,
      data.started_at,
      data.ended_at,
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
    [data.user_id, data.game_room_id, data.is_game_master || false, data.player_order || null]
  );
  return player;
}

export async function updateGameRoomPlayer(
  id: number,
  data: Partial<Pick<GameRoomPlayer, "is_game_master" | "player_order" | "cards_in_hand">>
): Promise<GameRoomPlayer | null> {
  const player = await db.oneOrNone<GameRoomPlayer>(
    gameRoomPlayerQueries.update,
    [data.is_game_master, data.player_order, data.cards_in_hand, id]
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

// export async function findGameRoomDecksByLocation(
//   gameRoomId: number,
//   location: "deck" | "discard" | "player_hand"
// ): Promise<GameRoomDeck[]> {
//   const decks = await db.manyOrNone<GameRoomDeck>(
//     gameRoomDeckQueries.findByLocation,
//     [gameRoomId, location]
//   );
//   return decks || [];
// }


export async function findGameRoomDecksByLocation(
  gameRoomId: number,
  location: "deck" | "discard" | "player_hand"
): Promise<(GameRoomDeck & { color: string; value: string })[]> {
  return await db.manyOrNone(`
    SELECT grd.*, uc.color, uc.value
    FROM game_room_decks grd
    JOIN uno_cards uc ON grd.card_id = uc.id
    WHERE grd.game_room_id = $1 AND grd.location = $2
    ORDER BY grd.position_index ASC
  `, [gameRoomId, location]);
}

// export async function findGameRoomDecksByPlayer(
//   gameRoomId: number,
//   playerId: number
// ): Promise<GameRoomDeck[]> {
//   const decks = await db.manyOrNone<GameRoomDeck>(
//     gameRoomDeckQueries.findByPlayer,
//     [gameRoomId, playerId]
//   );
//   return decks || [];
// }

export async function findGameRoomDecksByPlayer(
  gameRoomId: number,
  playerId: number
): Promise<(GameRoomDeck & { color: string; value: string })[]> {
  return await db.manyOrNone(`
    SELECT grd.*, uc.color, uc.value
    FROM game_room_decks grd
    JOIN uno_cards uc ON grd.card_id = uc.id
    WHERE grd.game_room_id = $1 AND grd.owner_player_id = $2
    ORDER BY grd.position_index ASC
  `, [gameRoomId, playerId]);
}

export async function createGameRoomDeck(data: CreateGameRoomDeckData): Promise<GameRoomDeck> {
  const deck = await db.one<GameRoomDeck>(
    gameRoomDeckQueries.create,
    [
      data.game_room_id,
      data.card_id,
      data.location,
      data.owner_player_id || null,
      data.position_index || null,
    ]
  );
  return deck;
}

export async function updateGameRoomDeck(
  id: number,
  data: Partial<Pick<GameRoomDeck, "location" | "owner_player_id" | "position_index">>
): Promise<GameRoomDeck | null> {
  const deck = await db.oneOrNone<GameRoomDeck>(
    gameRoomDeckQueries.update,
    [data.location, data.owner_player_id, data.position_index, id]
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


export async function startGame(gameRoomId: number){
  const players = await findGameRoomPlayersByGameRoom(gameRoomId);
  if (players.length === 0){
    throw new Error("No players in game room");
  }

  const allCards = await listUnoCards();
  const shuffled = allCards.sort(() => Math.random() - 0.5);

  const cardsPerPlayer = 7;
  let deckIndex = 0;

  /**
   *  For each player in players select a random card
   *  from the deck of cards and assign it to the player
   *  until each player has 7 random cards
   */

  for (const player of players){
    for (let i = 0;i < cardsPerPlayer; i++){
      await createGameRoomDeck({
        game_room_id: gameRoomId,
        card_id: shuffled[deckIndex].id,
        location: "player_hand",
        owner_player_id: player.id,
        position_index: i,
      });
      deckIndex++
    }
  }

  /**
   *  For the remaining cards in the shuffled deck
   *  place them in the deck of cards that players
   *  will pull from
   */

  for (let i=deckIndex; i < shuffled.length;i++){
    await createGameRoomDeck({
      game_room_id:gameRoomId,
      card_id: shuffled[i].id,
      location: "deck",
      position_index: i - deckIndex,
    });
  }

  /**
   *  Add the first discarded card to the discard pile
   *  this will be the card that the first player will
   *  try to match with on the very first turn
   */

  const firstCard = shuffled[deckIndex];
  await createGameRoomDeck({
    game_room_id: gameRoomId,
    card_id: firstCard.id,
    location: "discard",
    position_index: 0,
  });

  /**
   *  Update game room status from waiting to in progress
   */


  await updateGameRoom(gameRoomId, {
    status: "in_progress",
    started_at: new Date(),
  });

  console.log("[startGame] Game initialized for room", gameRoomId);

  return {message: "Game started successfully"};

}
