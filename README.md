# Term Project - Team H

## Multiplayer UNO Game

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- PostgreSQL (v16 or higher)
- npm

### Clone the Repository

```bash
git clone https://github.com/csc-667-fall-2025-roberts/term-project-team-h.git
cd term-project-team-h
```

### Install Dependencies

```bash
npm install
```

### Set Up PostgreSQL

1. **Install PostgreSQL**

2. **Create a Database**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create a new database
   CREATE DATABASE uno_game;
   
   # Exit psql
   \q
   ```

3. **Configure Environment Variables**
   - Copy the example environment file into a `.env` file:
     ```bash
     touch .env
     ```
   - Edit `.env` and update the `DATABASE_URL` with your PostgreSQL connection details:
     ```
     NODE_ENV=development
     PORT=3001
     DATABASE_URL=postgres://username:password@localhost:5432/uno_game
     ```
     Replace:
     - `username` with your PostgreSQL username (default: `postgres`)
     - `password` with your PostgreSQL password
     - `localhost` with your database host (if different)
     - `5432` with your PostgreSQL port (if different)
     - `uno_game` with your database name

     ### Test Database Connection

To verify that your database connection is working correctly:

```bash
npx tsx src/backend/test-db.ts
```

You should see "DB connected" if the connection is successful.

### Run Migrations

To set up the database schema, run the migrations:

```bash
npm run migrate:up
```

This will create all necessary tables and enums in your PostgreSQL database.

To rollback migrations (if needed):

```bash
npm run migrate:down
```

### Running the Application

For development:

```bash
npm run dev
```

For production:

```bash
npm run build
npm start
```

---