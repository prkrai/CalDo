# CALdo — Calendar + ToDo Task Manager

CALdo is a Calendar + ToDo Task Manager built with Node.js, Express, and MySQL, with a vanilla JavaScript frontend for task tracking and calendar rendering. It uses a normalized MySQL schema with separate `tasks` and `events` tables, and integrates with the Calendarific REST API to fetch and cache real public holiday data for India.

Backend: Node.js + Express
Database: MySQL (normalized schema)
Frontend: Vanilla JS, HTML, CSS
External integration: Calendarific public holiday API

## Setup

1. **Install dependencies**
npm install

2. **Create the database**

   Run the schema against your local MySQL server:
mysql -u root -p < db/schema.sql

3. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in your MySQL credentials and Calendarific API key:
cp .env.example .env

4. **Run the server**
npm start

   Or with auto-reload during development:
npm run dev

5. Open `http://localhost:5000` in your browser.

## API Endpoints

| Method | Endpoint            | Description                        |
|--------|----------------------|-------------------------------------|
| GET    | /api/tasks           | List tasks (optional ?status=)      |
| POST   | /api/tasks           | Create a task                       |
| PUT    | /api/tasks/:id       | Update a task                       |
| DELETE | /api/tasks/:id       | Delete a task                       |
| GET    | /api/events?month=   | List events for a given month       |
| POST   | /api/events          | Create an event                     |
| DELETE | /api/events/:id      | Delete an event                     |
| GET    | /api/holidays/:year  | Holidays for a year (?country=IN)   |

## How the pieces map to the resume bullets

- **JS task-tracking interface** -> `public/js/app.js` (task CRUD, calendar rendering, filtering)
- **SQL-based persistence, normalized schema** -> `db/schema.sql` (separate `tasks` / `events` tables, indexed on the columns actually queried)
- **Third-party REST API integration for holidays** -> `routes/holidays.js` (fetches from Calendarific, caches in MySQL so repeat loads dont re-hit the external API)

## A real integration story worth knowing for interviews

The original plan was to use the free Nager.Date API for holiday data. It turned out Nager.Date has no holiday coverage for India, it returns a success status with an empty body instead of an error, which initially caused a silent JSON-parsing crash. The fix was two-fold:

1. Defensively handle empty API responses instead of assuming every 200 status has a parseable body
2. Switch to Calendarific, which does have India coverage but requires an API key (so the integration now also involves auth via query param plus a free-tier rate limit of 1,000 calls per month, which the MySQL cache protects against)

This is a good story if asked "tell me about a bug you hit", it's a real, specific debugging anecdote rather than something generic.

## Honest gaps to know about for interviews

- No authentication/sessions yet, if the resume claims "persistent user sessions," either add a basic login (express-session or JWT) or adjust the wording.
- No automated tests.
- The holiday cache has no expiry, fine for a personal project, but worth mentioning as a known limitation if asked about production-readiness.
- Calendarific's free tier caps at 1,000 requests/month, the cache table exists specifically to stay under that limit.