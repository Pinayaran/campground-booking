# Campground Booking Project Plan

Group 2 (Teletubbies) requirements for SW Dev Project #2, based on the Campground Booking project brief and the seven additional Teletubbies requirements.

## 0. General Requirements and Constraints

- Implement the backend as a REST API (web API).
- Use MongoDB Atlas or PostgreSQL as the database.
- Authenticate users with a username or email and password (for example, using JWT). Keep user transactions private so users can only access their own, and hash passwords.
- Respond to requests within **3 seconds**.
- Make the API testable with Postman; a Postman collection should be included with the submission.
- The project brief does not require a frontend, but additional requirement 7 requires a main campground page, so this project must include that page.

## 1. Data Models

### User

- `name`, `tel`, `email` (unique), `password` (hashed), `role` (`user` or `admin`), `createdAt`

### Campground

- `name`, `address`, `tel` (base requirements)
- `location`, `province`, `region` (for filtering; additional requirement 1)
- `description`, `facilities` (array), `rules` (array or text) (additional requirement 4)
- `capacity` or the number of available spaces per day (for availability checks; additional requirement 2)
- Recommended: `averageRating`, `ratingCount`, and images for display on the frontend.

### Booking

- `user` (User reference), `campground` (Campground reference)
- Check-in date and number of nights, or check-in and check-out dates; stays must be **no longer than 3 nights**.
- `status` (for example, `upcoming`, `completed`, or `cancelled`) to determine whether a stay has ended before allowing a review (additional requirements 5–6).
- `createdAt`

### Review

Rating and comment may be stored together in one model.

- `user`, `campground`, `booking` (references), `rating` (1–5), `comment`, `createdAt`
- Allow only one review per booking.

## 2. Backend APIs

### Authentication and User

Base requirements 1–2 and additional requirement 3.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register with name, telephone number, email, and password. |
| `POST` | `/api/v1/auth/login` | Log in with email and password. |
| `GET` | `/api/v1/auth/logout` | Log out. |
| `GET` | `/api/v1/auth/me` | Get the current user's details. |
| `PUT` | `/api/v1/auth/updatedetails` | Update name, telephone number, or email; check that the email is not already in use. |
| `PUT` | `/api/v1/auth/updatepassword` | Change the password; the current password should be required. |

### Campgrounds

Base requirement 3 and additional requirements 1, 2, and 4.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/campgrounds` | List campgrounds; support location filters (for example, `?province=Chiang%20Mai`), name search, pagination, and sorting. |
| `GET` | `/api/v1/campgrounds/:id` | Get campground details, including description, facilities, rules, average rating, and reviews. |
| `GET` | `/api/v1/campgrounds/:id/availability?date=YYYY-MM-DD` | Check whether a campground has availability on a selected date and how many spaces remain. |
| `POST`, `PUT`, `DELETE` | `/api/v1/campgrounds/:id` | Admin-only campground management (not explicitly required, but needed to manage campground data). |

### Bookings

Base requirements 3–9.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/campgrounds/:id/bookings` | Create a booking for the campground and requested dates. Enforce the 3-night maximum and check availability using the same logic as the availability endpoint. |
| `GET` | `/api/v1/bookings` | List bookings. Users can see only their own; admins can see all bookings. |
| `GET` | `/api/v1/bookings/:id` | Get a booking. |
| `PUT` | `/api/v1/bookings/:id` | Update a booking. Users can update only their own; admins can update any booking. Recheck the 3-night maximum and availability. |
| `DELETE` | `/api/v1/bookings/:id` | Delete a booking. Users can delete only their own; admins can delete any booking. |

### Reviews and Ratings

Additional requirements 5–6.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/campgrounds/:id/reviews` | Submit a rating and review. Allow only users who booked that campground and whose stay has ended (or whose booking status is `completed`). Prevent more than one review per booking. |
| `GET` | `/api/v1/campgrounds/:id/reviews` | List reviews for a campground. |
| `PUT`, `DELETE` | `/api/v1/reviews/:id` | Recommended: allow the review owner or an admin to update or delete a review. |

Update the campground's `averageRating` when a review is added or deleted.

### Middleware

- `protect`: Verify the authentication token.
- `authorize('admin')`: Check that the user has the admin role.

## 3. Frontend: Main Campground Page

Additional requirement 7.

- **Navbar:** Logo, home link, My Bookings, Profile, and Login/Register or Logout controls depending on authentication status.
- **Available campground listing:** Cards showing the campground name, location, rating, and image.
- **Search bar:** Search by campground name.
- **Filters:** Filter by location; if possible, allow users to select a date and show only campgrounds that are available then.
- Fetch data from the actual backend API (for example, `GET /api/v1/campgrounds?...`).
- A frontend for other pages (details, booking, profile, and reviews) is not required; those features can be tested through Postman. They may be added if time allows.

## 4. Testing and Submission

- Include a Postman collection covering every endpoint, including successful and error cases such as:
  - Booking more than 3 nights
  - Updating another user's booking
  - Reviewing before a stay has ended
  - Registering with a duplicate email
- Seed sample data with campgrounds in multiple locations and at least one regular user and one admin.
- Verify that response times are under **3 seconds**.

## Requirements-to-Work Mapping

| Requirement | Work |
|---|---|
| Base 1–2: Register, log in, and log out | Authentication APIs |
| Base 3: Book for no more than 3 nights and list campgrounds | `GET /campgrounds` and `POST` bookings |
| Base 4–6: Users can view, update, and delete their own bookings | Booking APIs with ownership checks |
| Base 7–9: Admins can view, update, and delete all bookings | Booking APIs with admin role checks |
| Additional 1: Filter by location | Location filters in `GET /campgrounds` |
| Additional 2: Check availability by date | `GET /campgrounds/:id/availability` and capacity data |
| Additional 3: Update personal details | `PUT /auth/updatedetails` and `PUT /auth/updatepassword` |
| Additional 4: View campground details | `GET /campgrounds/:id` and description, facilities, and rules fields |
| Additional 5–6: Rate and review after a stay | Review model and APIs with completed-stay checks |
| Additional 7: Main page frontend | Navbar, campground listing, search, and filters |

## Work Division

**Dipsy** owns the base requirements (the core backend: auth, campground CRUD, and bookings). **Lala** owns additional requirements 1–7 (filters, availability, profile updates, campground details, reviews, and the frontend).

Dipsy's work is the foundation, so it comes first. While Dipsy builds it, Lala works on the parts that don't depend on it (the frontend skeleton, the `Review` model, and the availability logic).

File paths below assume Express with MongoDB/Mongoose. Adjust them if the team picks PostgreSQL.

### Suggested Folder Structure

```
backend/
  server.js            # app entry, mounts routes
  config/db.js         # DB connection
  config/config.env    # MONGO_URI, JWT_SECRET, JWT_EXPIRE, JWT_COOKIE_EXPIRE, PORT (not committed)
  models/              # User.js, Campground.js, Booking.js, Review.js
  controllers/         # auth.js, campgrounds.js, bookings.js, reviews.js
  routes/              # auth.js, campgrounds.js, bookings.js, reviews.js
  middleware/auth.js   # protect, authorize
  utils/availability.js
  seeder.js
frontend/              # main campground page
postman/               # exported collection + environment
```

### Phase 0: Together (Day 1)

Do this together before splitting up, so neither person has to rework anything later.

- [ ] Create the repo structure above, `package.json`, and `.gitignore` (ignore `node_modules` and `config.env`).
- [ ] Set up a shared MongoDB Atlas cluster and share the connection string privately (not in git).
- [ ] Agree on the **response format**:
  - Success: `{ success: true, data: ... }` (plus `count` and `pagination` for lists).
  - Error: `{ success: false, message: "..." }`.
- [ ] Agree on **status codes**: `200` OK, `201` created, `400` validation or business-rule error, `401` not logged in, `403` not allowed (wrong owner or role), `404` not found, `500` server error.
- [ ] Agree on the **booking date fields**: `checkInDate` (Date) plus `nights` (1–3). Check-out is computed as `checkInDate + nights`.
- [ ] Agree on the **availability helper signature** (see Handoff Points).
- [ ] Git workflow: each person works on a feature branch (e.g. `dipsy/bookings`, `lala/reviews`) and merges into `main` through a PR that the other person reviews.

### Dipsy: Base Requirements

#### D1. Server and Database Setup

- [ ] `server.js`: Express app, JSON body parser, `cookie-parser`, route mounting under `/api/v1`, and a basic error handler.
- [ ] `config/db.js`: connect to MongoDB using `MONGO_URI`.
- [ ] Security basics: `cors`, and optionally `helmet` and a rate limiter.
- **Done when:** the server starts and connects to Atlas without errors.

#### D2. User Model and Authentication (Base 1–2)

- [ ] `models/User.js`: `name`, `tel`, `email` (unique, validated format), `password` (min length, `select: false`), `role` (`user`/`admin`, default `user`), `createdAt`.
  - Hash the password with bcrypt in a `pre('save')` hook, only when it has been modified (Lala's password change depends on this).
  - Add methods `getSignedJwtToken()` and `matchPassword(entered)`.
- [ ] `controllers/auth.js` and `routes/auth.js`:
  - `POST /auth/register`: create the user and return a token. A duplicate email returns `400`.
  - `POST /auth/login`: check email and password. Wrong credentials return `401` without saying which field was wrong.
  - `GET /auth/logout`: clear the token cookie.
  - `GET /auth/me`: return the current user (requires `protect`).
  - Send the token both in the response body and as an `httpOnly` cookie.
- **Done when:** a user can register, log in, call `/me` with the token, and log out.

#### D3. Auth Middleware

- [ ] `middleware/auth.js`:
  - `protect`: read the token from the `Authorization: Bearer` header (or the cookie), verify it, and set `req.user`. Return `401` if the token is missing or invalid.
  - `authorize(...roles)`: return `403` if `req.user.role` is not in `roles`.
- **Done when:** a protected route rejects requests without a token, and an admin-only route rejects regular users.
- **Hand this to Lala as early as possible.**

#### D4. Base Campground Model and CRUD (Base 3)

- [ ] `models/Campground.js`: `name` (required, unique), `address`, `tel`. Lala adds the other fields to this same file.
- [ ] Add a virtual `bookings` field, and delete a campground's bookings when the campground is deleted.
- [ ] `controllers/campgrounds.js` and `routes/campgrounds.js`:
  - `GET /campgrounds`: plain list (Lala adds filters later).
  - `GET /campgrounds/:id`: single campground. An unknown id returns `404`.
  - `POST`, `PUT`, `DELETE /campgrounds/:id`: `protect` + `authorize('admin')`.
- **Done when:** an admin can create, update, and delete campgrounds, and anyone can list and view them.

#### D5. Booking Model and APIs (Base 3–9)

- [ ] `models/Booking.js`: `user` (ref User), `campground` (ref Campground), `checkInDate`, `nights` (min 1, max 3), `status` (`upcoming`/`completed`/`cancelled`, default `upcoming`), `createdAt`.
- [ ] Routes: mount `/campgrounds/:campgroundId/bookings` as a nested router, plus `/bookings`.
- [ ] `POST /campgrounds/:campgroundId/bookings` (`protect`):
  - Check that the campground exists (`404` otherwise).
  - Reject `nights > 3` or `nights < 1` with `400`.
  - Reject check-in dates in the past with `400`.
  - Call Lala's `checkAvailability(...)` and return `400` if the campground is full.
  - Set `user` from `req.user`, never from the request body.
- [ ] `GET /bookings` (`protect`): regular users see only their own bookings, admins see all. Populate the campground's `name`, `address`, and `tel`.
- [ ] `GET /bookings/:id` (`protect`): owner or admin only, `403` otherwise.
- [ ] `PUT /bookings/:id` (`protect`): owner or admin only. Recheck the 3-night limit and availability (excluding the booking being edited). Don't let users change `user` or `status`.
- [ ] `DELETE /bookings/:id` (`protect`): owner or admin only.
- [ ] Mark bookings whose check-out date has passed as `completed`. Either compute this whenever bookings are read, or add a small helper Lala can call. Agree on which with Lala.
- **Done when:** every row of Base 3–9 in the mapping table works in Postman, including the error cases.

#### D6. Seed Data and Postman (Base Part)

- [ ] `seeder.js`: import and destroy commands (`node seeder -i` / `node seeder -d`). Create one admin, two regular users, and a few bookings, including **one past booking** so Lala can test reviews.
- [ ] Postman folders **Auth**, **Campgrounds (admin)**, and **Bookings**, with tests for:
  - Registering with a duplicate email → `400`
  - Logging in with a wrong password → `401`
  - Booking 4 nights → `400`
  - User A updating or deleting User B's booking → `403`
  - Admin viewing, updating, and deleting any booking → `200`
  - A regular user calling admin campground routes → `403`
- [ ] Set up a Postman environment with `{{URL}}` and `{{TOKEN}}`, and have the login request save the token automatically.

### Lala: Additional Requirements

#### L1. Campground Model Fields (Additional 1, 2, 4)

- [ ] Add to `models/Campground.js`: `location`, `province`, `region` (enum: e.g. North, Northeast, Central, East, West, South), `description`, `facilities` ([String]), `rules` ([String]), `capacity` (Number, min 1), `averageRating` (default 0), `ratingCount` (default 0), `images` ([String] URLs).
- [ ] Add a virtual `reviews` field.
- [ ] Add database indexes on `province`, `region`, and `name` so searches stay fast (helps the 3-second limit).
- **Coordinate:** wait for Dipsy's D4 to be merged first, or agree on who edits the file to avoid merge conflicts.

#### L2. Availability (Additional 2)

Start this early. Dipsy's booking endpoints depend on it.

- [ ] `utils/availability.js`: `checkAvailability(campgroundId, checkInDate, nights, excludeBookingId?)`:
  - For each night of the requested stay, count the bookings that are not `cancelled` and overlap that night.
  - Return `{ available: boolean, remaining: number }`, where `remaining` is `capacity` minus the busiest night's count.
  - Skip `excludeBookingId`, so editing a booking doesn't count against itself.
- [ ] `GET /campgrounds/:id/availability?date=YYYY-MM-DD` (public): return `{ date, capacity, booked, remaining, available }`.
  - A missing or invalid date returns `400`; an unknown campground returns `404`.
- **Done when:** with `capacity = 2` and two overlapping bookings, availability shows `0` remaining and Dipsy's booking create returns `400`.

#### L3. Location Filter, Search, Pagination, and Sorting (Additional 1)

- [ ] Extend `GET /campgrounds` to accept:
  - `?province=Chiang Mai`, `?region=North` (exact match, case-insensitive)
  - `?search=pine` (case-insensitive regex match on `name`)
  - `?sort=name` or `?sort=-averageRating`
  - `?page=2&limit=10` (default limit 10, maximum 50)
  - `?date=YYYY-MM-DD` (optional): return only campgrounds with space on that date, reusing `checkAvailability`. The frontend date filter uses this.
- [ ] Return `count`, `pagination: { next, prev }`, and `data`.
- **Done when:** each parameter works by itself and combined with the others.

#### L4. Update Personal Details (Additional 3)

- [ ] `PUT /auth/updatedetails` (`protect`): accept only `name`, `tel`, and `email`, and ignore `role` and `password` if sent. If the email belongs to another user, return `400`.
- [ ] `PUT /auth/updatepassword` (`protect`): require `currentPassword` and `newPassword`. A wrong current password returns `401`. Save with `user.save()` so the hash hook runs, then return a new token.
- **Done when:** the user can log in with the new password but not the old one.

#### L5. Campground Details (Additional 4)

- [ ] Extend `GET /campgrounds/:id` to return all detail fields plus the latest reviews (populate the `reviews` virtual with the reviewer's name, newest first, e.g. the latest 10).
- **Done when:** one request returns everything a detail page would need.

#### L6. Reviews and Ratings (Additional 5–6)

- [ ] `models/Review.js`: `user`, `campground`, `booking` (refs), `rating` (integer 1–5, required), `comment` (max length e.g. 500), `createdAt`.
  - Add a unique index on `booking` (one review per booking).
  - Add a static `calcAverageRating(campgroundId)` that updates the campground's `averageRating` (rounded to 1 decimal) and `ratingCount`. Call it after saving and after deleting a review.
- [ ] `POST /campgrounds/:campgroundId/reviews` (`protect`), body `{ bookingId, rating, comment }`:
  - The booking must belong to `req.user`, otherwise `403`.
  - The booking must be for this campground, otherwise `400`.
  - The stay must have ended (check-out date is in the past, or `status = completed`), otherwise `400` "You can only review after your stay".
  - A booking that already has a review returns `400`.
- [ ] `GET /campgrounds/:campgroundId/reviews` (public): paginated, newest first.
- [ ] `PUT /reviews/:id` and `DELETE /reviews/:id` (`protect`): the review owner can update or delete their own review, and an admin can delete any review. Recalculate the average after either change.
- **Done when:** the average updates correctly after adding, editing, and deleting reviews, and all the error cases return the right codes.

#### L7. Frontend Main Page (Additional 7)

The frontend skeleton can start on day 1 using fake data, then switch to the real API once L3 is ready.

- [ ] Choose a stack (plain HTML/JS, or React/Next.js) and set up the backend's `cors` to allow the frontend's origin.
- [ ] **Navbar:** logo, Home, My Bookings, Profile. Show Login/Register when logged out and Logout when logged in, based on the token in `localStorage` or the cookie and a call to `/auth/me`.
- [ ] **Login/Register forms** (simple, so the navbar state can actually be shown working).
- [ ] **Campground cards:** image, name, province/region, average rating as stars, and rating count.
- [ ] **Search bar:** name search with a short delay (debounce), calling `GET /campgrounds?search=`.
- [ ] **Filters:** province/region dropdown and a date picker, which add `?province=`, `?region=`, and `?date=` to the request.
- [ ] Pagination controls, plus loading, empty ("No campgrounds found"), and error states.
- [ ] Make it usable on mobile.
- **Done when:** the page shows real data from the backend, and search and filters change the results.

#### L8. Seed Data and Postman (Additional Part)

- [ ] Add 8–12 campgrounds to `seeder.js` across at least 4 provinces and 3 regions, with every detail field filled and one campground at `capacity = 1` for testing "full".
- [ ] Add a few reviews for the past bookings Dipsy seeded.
- [ ] Postman folders **Campground Search**, **Availability**, **Profile**, and **Reviews**, with tests for:
  - Filtering by province or region, searching, paging, and the date filter
  - Availability on a fully booked date → `remaining: 0`
  - Updating the email to one already in use → `400`
  - Changing the password with a wrong current password → `401`
  - Reviewing before the stay has ended → `400`
  - Reviewing someone else's booking → `403`
  - Reviewing the same booking twice → `400`
  - A rating of 0 or 6 → `400`

### Handoff Points

| What | From → To | Needed by | Agreement |
|---|---|---|---|
| `protect` / `authorize` middleware (D3) | Dipsy → Lala | Before L4, L6 | Merge as early as possible; Lala can use a stub until then. |
| Base `Campground` model (D4) | Dipsy → Lala | Before L1 | Lala adds fields to the same file after D4 is merged. |
| `Booking` model with `status` (D5) | Dipsy → Lala | Before L2, L6 | Field names `checkInDate`, `nights`, `status` as agreed in Phase 0. |
| `checkAvailability()` (L2) | Lala → Dipsy | Before D5 create/update | Signature `checkAvailability(campgroundId, checkInDate, nights, excludeBookingId?)` → `{ available, remaining }`. Dipsy can use a stub that always returns available until it is merged. |
| Past bookings in the seed data (D6) | Dipsy → Lala | Before testing L6 | At least one past booking per regular user. |
| How bookings become `completed` (D5) | Dipsy ↔ Lala | Before L6 | Decide together: compute it on read, or check the check-out date in the review endpoint. |

### Suggested Timeline

| Phase | Dipsy | Lala |
|---|---|---|
| 0 (together) | Repo setup, conventions | Repo setup, conventions |
| 1 | D1, D2, D3 | L2 (helper logic), L7 skeleton with fake data, `Review` model draft |
| 2 | D4, D5 | L1, L3, L4, L5 |
| 3 | D6 (seed + Postman) | L6, L7 connected to the real API |
| 4 (together) | Integration testing, response-time checks, merge Postman collection, update README | Same |

### Final Checklist (Together)

- [ ] Every endpoint in Section 2 has at least one success and one error request in Postman.
- [ ] One combined Postman collection plus its environment is exported to `postman/`.
- [ ] Every request responds in under 3 seconds (check Postman's response time; add `pm.expect(pm.response.responseTime).to.be.below(3000)` tests).
- [ ] `node seeder -i` on an empty database produces a working demo.
- [ ] The README explains setup, the environment variables, how to seed, and how to run the backend and frontend.
- [ ] No secrets are committed (`config.env` is in `.gitignore`).
