/**
 * SQL queries for authentication and user management
 */

export const userQueries = {
  // User CRUD operations
  findByUsername: "SELECT * FROM users WHERE username = $1",
  findByEmail: "SELECT * FROM users WHERE email = $1",
  create: `
    INSERT INTO users (username, email, password)
    VALUES ($1, $2, $3)
    RETURNING id, username, email, created_at
  `,
};

