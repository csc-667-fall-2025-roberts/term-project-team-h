/**
 * Authentication and user database operations
 * 
 * This module provides functions for user management and authentication.
 * It follows a pattern where SQL queries are separated in sql.ts and
 * business logic functions are defined here.
 */

import db from "../connection";
import { userQueries } from "./sql";

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  created_at: Date;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  password?: string;
}

/**
 * Find a user by ID
 */
export async function findUserById(id: number): Promise<User | null> {
  const user = await db.oneOrNone<User>(userQueries.findById, [id]);
  return user;
}

/**
 * Find a user by username
 */
export async function findUserByUsername(username: string): Promise<User | null> {
  const user = await db.oneOrNone<User>(userQueries.findByUsername, [username]);
  return user;
}

/**
 * Find a user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const user = await db.oneOrNone<User>(userQueries.findByEmail, [email]);
  return user;
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserData): Promise<Omit<User, "password">> {
  const user = await db.one<Omit<User, "password">>(
    userQueries.create,
    [data.username, data.email, data.password]
  );
  return user;
}

/**
 * Update an existing user
 */
export async function updateUser(
  id: number,
  data: UpdateUserData
): Promise<Omit<User, "password"> | null> {
  const user = await db.oneOrNone<Omit<User, "password">>(
    userQueries.update,
    [data.username, data.email, data.password, id]
  );
  return user;
}

/**
 * Delete a user
 */
export async function deleteUser(id: number): Promise<boolean> {
  const result = await db.result(userQueries.delete, [id]);
  return result.rowCount > 0;
}

/**
 * List all users (without passwords)
 */
export async function listUsers(): Promise<Omit<User, "password">[]> {
  const users = await db.manyOrNone<Omit<User, "password">>(userQueries.list);
  return users || [];
}

