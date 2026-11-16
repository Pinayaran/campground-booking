# campground-booking

Campground Booking system (SW Dev Project #2, Group 2 Teletubbies): a REST API built with Node.js, Express, and MongoDB for searching, booking, rating, and reviewing campgrounds, with a frontend for the main campground page.

See [plan.md](./plan.md) for the project requirements and implementation checklist.

## Backend Setup

```bash
cd backend
npm install
cp config/config.env.example config/config.env   # then fill in MONGO_URI and JWT_SECRET
node seeder -i     # load sample data (node seeder -d clears it)
npm run dev        # http://localhost:5000/api/v1
```

The seeder wipes the database it connects to, so it refuses a non-local `MONGO_URI` unless you add `--force` (e.g. `node seeder -i --force` for the shared Atlas cluster).

Seeded accounts (password `123456` for all): `admin@gmail.com` (admin), `user1@gmail.com`, and `user2@gmail.com`. Admin accounts can only be created by the seeder; `POST /auth/register` always creates a regular user.

## Postman

Import both files in [postman/](./postman/), select the **Campground Booking** environment, run `node seeder -i` (add `--force` for the shared Atlas cluster), and then run the collection in order. The login requests save `{{TOKEN}}` automatically.

## Frontend Setup

The frontend is a Next.js (App Router, JavaScript, Tailwind CSS) app for the main campground page. Start the backend first.

```bash
cd frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL, defaults to http://localhost:5000/api/v1
npm run dev                  # http://localhost:3000
```

The backend only accepts requests from `CLIENT_URL` in `config/config.env` (default `http://localhost:3000`).

Pages:

- `/`: campground cards with name search, province, region and date filters, and pagination
- `/login` and `/register`
- `/bookings` and `/profile`: the logged-in user's bookings and details (read-only; editing is done through the API)

## Tests

```bash
cd backend && npm test     # Jest + supertest against an in-memory MongoDB (no Atlas needed)
cd frontend && npm test    # Jest + React Testing Library
```

To run the Postman collection from the command line, seed the database and start the backend, then run this from `backend/`:

```bash
node seeder -i
npx newman run ../postman/campground-booking.postman_collection.json -e ../postman/campground-booking.postman_environment.json
```

Every request also checks that the response arrives in under 3 seconds. The collection expects freshly seeded data, so run `node seeder -i` before each run (add `--force` when `MONGO_URI` is not local).

## API Endpoints

All endpoints are under `/api/v1`. 🔒 means a login token is required.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/auth/register` | Register (name, tel, email, password) |
| `POST` | `/auth/login` | Log in and get a token |
| `GET` | `/auth/logout` 🔒 | Log out (the token is revoked) |
| `GET` | `/auth/me` 🔒 | Current user |
| `PUT` | `/auth/updatedetails` 🔒 | Update name, tel or email |
| `PUT` | `/auth/updatepassword` 🔒 | Change password (`currentPassword`, `newPassword`); returns a new token and revokes the old one |
| `GET` | `/campgrounds` | List campgrounds. Query: `province`, `region`, `search` (name), `date=YYYY-MM-DD` (only campgrounds with space), `sort`, `select`, `page`, `limit` (default 10, max 50) |
| `GET` | `/campgrounds/locations` | Provinces and regions in use, for filter dropdowns |
| `GET` | `/campgrounds/:id` | Details: description, facilities, rules, capacity, rating and the latest 10 reviews |
| `GET` | `/campgrounds/:id/availability?date=YYYY-MM-DD` | `{ date, capacity, booked, remaining, available }` |
| `POST`, `PUT`, `DELETE` | `/campgrounds`, `/campgrounds/:id` 🔒 | Admin only |
| `POST` | `/campgrounds/:id/bookings` 🔒 | Book (`checkInDate` as `YYYY-MM-DD`, `nights` 1–3) |
| `GET` | `/bookings`, `/campgrounds/:id/bookings` 🔒 | Your bookings (admins see all) |
| `GET`, `PUT`, `DELETE` | `/bookings/:id` 🔒 | Owner or admin |
| `GET` | `/campgrounds/:id/reviews`, `/reviews` | Reviews, newest first, paginated |
| `POST` | `/campgrounds/:id/reviews` 🔒 | Rate (1–5) and review a completed stay (`bookingId`, `rating`, `comment`); one review per booking |
| `PUT` | `/reviews/:id` 🔒 | Review owner only |
| `DELETE` | `/reviews/:id` 🔒 | Review owner or admin |
