/**
 * SQL queries for authentication and user management
 */

export const userQueries = {
  // User CRUD operations
  findById: "SELECT * FROM users WHERE id = $1",
  findByUsername: "SELECT * FROM users WHERE username = $1",
  findByEmail: "SELECT * FROM users WHERE email = $1",
  create: `
    INSERT INTO users (username, email, password)
    VALUES ($1, $2, $3)
    RETURNING id, username, email, created_at
  `,
  update: `
    UPDATE users
    SET username = COALESCE($1, username),
        email = COALESCE($2, email),
        password = COALESCE($3, password)
    WHERE id = $4
    RETURNING id, username, email, created_at
  `,
  delete: "DELETE FROM users WHERE id = $1",
  list: "SELECT id, username, email, created_at FROM users ORDER BY created_at DESC",
};

