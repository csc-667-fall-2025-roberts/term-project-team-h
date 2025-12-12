/**
 * Authentication and user database operations
 */

import bcrypt from "bcrypt";
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
 * Sign up a new user
 */
export async function signup(
  username: string,
  email: string,
  password: string
): Promise<Omit<User, "password">> {

  const existingUser = await findUserByUsername(username);
  if (existingUser) {
    throw new Error("Username already exists");
  }


  const existingEmail = await findUserByEmail(email);
  if (existingEmail) {
    throw new Error("Email already exists");
  }


  const hashedPassword = await bcrypt.hash(password, 10);


  const user = await createUser({
    username,
    email,
    password: hashedPassword,
  });

  return user;
}

/**
 * Log in a user
 */
export async function login(
  username: string,
  password: string
): Promise<Omit<User, "password">> {

  const user = await findUserByUsername(username);
  if (!user) {
    throw new Error("Invalid username or password");
  }


  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new Error("Invalid username or password");
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    created_at: user.created_at,
  };
}

