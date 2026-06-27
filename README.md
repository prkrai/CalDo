# CALdo — Calendar + ToDo Task Manager

Backend: Node.js + Express
Database: MySQL (normalized schema)
Frontend: Vanilla JS, HTML, CSS
External integration: Nager.Date public holiday API

## Setup

1. **Install dependencies**
   ```
   npm install
   ```

2. **Create the database**
   Run the schema against your local MySQL server:
   ```
   mysql -u root -p < db/schema.sql
   ```

3. **Configure environment variables**
   Copy `.env.example` to `.env` and fill in your MySQL credentials:
   ```
   cp .env.example .env
   ```

4. **Run the server**
   ```
   npm start
   ```
   Or with auto-reload during development:
   ```
   npm run dev
   ```

5. Open `http://localhost:5000` in your browser.

## API Endpoints

| Method | Endpoint              | Description                          |
|--------|------------------------|---------------------------------------|
| GET    | /api/tasks             | List tasks (optional ?status=)        |
| POST   | /api/tasks             | Create a task                         |
| PUT    | /api/tasks/:id         | Update a task                         |
| DELETE | /api/tasks/:id         | Delete a task                         |
| GET    | /api/events?month=     | List events for a given month         |
| POST   | /api/events            | Create an event                       |
| DELETE | /api/events/:id        | Delete an event                       |
| GET    | /api/holidays/:year    | Holidays for a year (?country=IN)     |

## How the pieces map to your resume bullets

- **JS task-tracking interface** → `public/js/app.js` (task CRUD, calendar rendering, filtering)
- **SQL-based persistence, normalized schema** → `db/schema.sql` (separate `tasks` / `events` tables, indexed on the columns actually queried)
- **Third-party REST API integration for holidays** → `routes/holidays.js` (fetches from Nager.Date, caches in MySQL so repeat loads don't re-hit the external API)

## Honest gaps to know about for interviews

- No authentication/sessions yet — if your resume claims "persistent user sessions," either add a basic login (express-session or JWT) or adjust the wording.
- No automated tests.
- The holiday cache has no expiry — fine for a personal project, but worth mentioning as a known limitation if asked about production-readiness.
