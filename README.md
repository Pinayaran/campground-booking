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

Seeded accounts (password `123456` for all): `admin@gmail.com` (admin), `user1@gmail.com`, and `user2@gmail.com`. Admin accounts can only be created by the seeder; `POST /auth/register` always creates a regular user.

## Postman

Import both files in [postman/](./postman/), select the **Campground Booking** environment, run `node seeder -i`, and then run the collection in order. The login requests save `{{TOKEN}}` automatically.
