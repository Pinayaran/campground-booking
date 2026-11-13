const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { daysFromToday } = require('../utils/dates');
const Campground = require('../models/Campground');
const Review = require('../models/Review');
const { createUser, createCampground, createBooking } = require('./helpers');

const auth = (token) => ({ Authorization: `Bearer ${token}` });

let userA, userB, admin, camp, otherCamp, completed, upcoming;

beforeEach(async () => {
    userA = await createUser();
    userB = await createUser();
    admin = await createUser({ role: 'admin' });
    camp = await createCampground();
    otherCamp = await createCampground();
    completed = await createBooking({ user: userA.user, campground: camp, checkInDate: daysFromToday(-5), status: 'completed' });
    upcoming = await createBooking({ user: userA.user, campground: camp, checkInDate: daysFromToday(5) });
});

const postReview = (campgroundId, token, body) => {
    const req = request(app).post(`/api/v1/campgrounds/${campgroundId}/reviews`);
    return (token ? req.set(auth(token)) : req).send(body);
};

//Review created straight in the DB (bypasses the controller rules)
const seedReview = async ({ booking, rating = 4, createdAt } = {}) => {
    const stay = booking || await createBooking({ user: userA.user, campground: camp, checkInDate: daysFromToday(-5), status: 'completed' });
    return Review.create({
        user: stay.user,
        campground: stay.campground,
        booking: stay._id,
        rating,
        ...(createdAt && { createdAt })
    });
};

describe('POST /campgrounds/:id/reviews', () => {
    test('creates a review and updates the campground rating', async () => {
        const res = await postReview(camp.id, userA.token, { bookingId: completed.id, rating: 4, comment: 'Lovely' });

        expect(res.status).toBe(201);
        expect(res.body.data.rating).toBe(4);
        expect(res.body.data.user).toBe(userA.user.id);

        const updated = await Campground.findById(camp.id);
        expect(updated.averageRating).toBe(4);
        expect(updated.ratingCount).toBe(1);
    });

    test('accepts a past stay not yet marked completed', async () => {
        const past = await createBooking({ user: userA.user, campground: camp, checkInDate: daysFromToday(-10), nights: 2 });
        expect(past.status).toBe('upcoming');

        const res = await postReview(camp.id, userA.token, { bookingId: past.id, rating: 5 });

        expect(res.status).toBe(201);
    });

    test('before the stay has ended -> 400', async () => {
        const res = await postReview(camp.id, userA.token, { bookingId: upcoming.id, rating: 4 });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('You can only review after your stay');
    });

    test('cancelled booking -> 400', async () => {
        const cancelled = await createBooking({ user: userA.user, campground: camp, checkInDate: daysFromToday(-5), status: 'cancelled' });

        const res = await postReview(camp.id, userA.token, { bookingId: cancelled.id, rating: 4 });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('You can only review after your stay');
    });

    test("someone else's booking -> 403", async () => {
        const res = await postReview(camp.id, userB.token, { bookingId: completed.id, rating: 4 });

        expect(res.status).toBe(403);
    });

    test('booking from another campground -> 400', async () => {
        const res = await postReview(otherCamp.id, userA.token, { bookingId: completed.id, rating: 4 });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('This booking is not for this campground');
    });

    test('second review for the same booking -> 400', async () => {
        await postReview(camp.id, userA.token, { bookingId: completed.id, rating: 4 });
        const res = await postReview(camp.id, userA.token, { bookingId: completed.id, rating: 3 });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('This booking has already been reviewed');
    });

    test.each([0, 6])('rating %p -> 400', async (rating) => {
        const res = await postReview(camp.id, userA.token, { bookingId: completed.id, rating });

        expect(res.status).toBe(400);
    });

    test('missing bookingId -> 400', async () => {
        const res = await postReview(camp.id, userA.token, { rating: 4 });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Please provide a bookingId');
    });

    test('invalid bookingId -> 400', async () => {
        const res = await postReview(camp.id, userA.token, { bookingId: 'abc', rating: 4 });

        expect(res.status).toBe(400);
    });

    test('unknown bookingId -> 404', async () => {
        const res = await postReview(camp.id, userA.token, { bookingId: new mongoose.Types.ObjectId().toString(), rating: 4 });

        expect(res.status).toBe(404);
    });

    test('unknown campground -> 404', async () => {
        const res = await postReview(new mongoose.Types.ObjectId().toString(), userA.token, { bookingId: completed.id, rating: 4 });

        expect(res.status).toBe(404);
    });

    test('no token -> 401', async () => {
        const res = await postReview(camp.id, null, { bookingId: completed.id, rating: 4 });

        expect(res.status).toBe(401);
    });

    test('POST /reviews without a campground -> 400', async () => {
        const res = await request(app).post('/api/v1/reviews').set(auth(userA.token)).send({ bookingId: completed.id, rating: 4 });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Please post reviews to /api/v1/campgrounds/:campgroundId/reviews');
    });
});

describe('GET /campgrounds/:id/reviews', () => {
    test('lists newest first with the reviewer name only', async () => {
        const older = await seedReview({ rating: 2, createdAt: new Date('2026-01-01') });
        const newer = await seedReview({ rating: 5, createdAt: new Date('2026-02-01') });

        const res = await request(app).get(`/api/v1/campgrounds/${camp.id}/reviews`);

        expect(res.status).toBe(200);
        expect(res.body.count).toBe(2);
        expect(res.body.data[0]._id).toBe(newer.id);
        expect(res.body.data[1]._id).toBe(older.id);
        expect(res.body.data[0].user.name).toBeDefined();
        expect(res.body.data[0].user.email).toBeUndefined();
    });

    test('paginates', async () => {
        await seedReview();
        await seedReview();

        const res = await request(app).get(`/api/v1/campgrounds/${camp.id}/reviews?limit=1`);

        expect(res.status).toBe(200);
        expect(res.body.count).toBe(1);
        expect(res.body.pagination.next).toBeDefined();
    });

    test('only returns reviews of that campground', async () => {
        await seedReview();
        const elsewhere = await createBooking({ user: userA.user, campground: otherCamp, checkInDate: daysFromToday(-5), status: 'completed' });
        await seedReview({ booking: elsewhere });

        const res = await request(app).get(`/api/v1/campgrounds/${camp.id}/reviews`);

        expect(res.body.count).toBe(1);
    });

    test('unknown campground -> 404', async () => {
        const res = await request(app).get(`/api/v1/campgrounds/${new mongoose.Types.ObjectId()}/reviews`);

        expect(res.status).toBe(404);
    });

    test('GET /reviews lists reviews across campgrounds, publicly', async () => {
        await seedReview();
        const elsewhere = await createBooking({ user: userA.user, campground: otherCamp, checkInDate: daysFromToday(-5), status: 'completed' });
        await seedReview({ booking: elsewhere });

        const res = await request(app).get('/api/v1/reviews');

        expect(res.status).toBe(200);
        expect(res.body.count).toBe(2);
    });
});

describe('PUT /reviews/:id', () => {
    test('owner updates rating and comment; average recalculates', async () => {
        const review = await seedReview({ booking: completed, rating: 4 });

        const res = await request(app).put(`/api/v1/reviews/${review.id}`).set(auth(userA.token)).send({ rating: 2, comment: 'Meh' });

        expect(res.status).toBe(200);
        expect(res.body.data.rating).toBe(2);
        expect(res.body.data.comment).toBe('Meh');

        const updated = await Campground.findById(camp.id);
        expect(updated.averageRating).toBe(2);
    });

    test('booking, user and campground in the body are ignored', async () => {
        const review = await seedReview({ booking: completed });

        const res = await request(app).put(`/api/v1/reviews/${review.id}`).set(auth(userA.token)).send({
            rating: 3,
            booking: upcoming.id,
            user: userB.user.id,
            campground: otherCamp.id
        });

        expect(res.status).toBe(200);
        const stored = await Review.findById(review.id);
        expect(stored.booking.toString()).toBe(completed.id);
        expect(stored.user.toString()).toBe(userA.user.id);
        expect(stored.campground.toString()).toBe(camp.id);
    });

    test('invalid rating -> 400', async () => {
        const review = await seedReview({ booking: completed });

        const res = await request(app).put(`/api/v1/reviews/${review.id}`).set(auth(userA.token)).send({ rating: 9 });

        expect(res.status).toBe(400);
    });

    test('another user -> 403', async () => {
        const review = await seedReview({ booking: completed });

        const res = await request(app).put(`/api/v1/reviews/${review.id}`).set(auth(userB.token)).send({ rating: 1 });

        expect(res.status).toBe(403);
    });

    test('admin -> 403', async () => {
        const review = await seedReview({ booking: completed });

        const res = await request(app).put(`/api/v1/reviews/${review.id}`).set(auth(admin.token)).send({ rating: 1 });

        expect(res.status).toBe(403);
    });

    test('unknown id -> 404', async () => {
        const res = await request(app).put(`/api/v1/reviews/${new mongoose.Types.ObjectId()}`).set(auth(userA.token)).send({ rating: 1 });

        expect(res.status).toBe(404);
    });

    test('invalid id -> 400', async () => {
        const res = await request(app).put('/api/v1/reviews/abc').set(auth(userA.token)).send({ rating: 1 });

        expect(res.status).toBe(400);
    });
});

describe('DELETE /reviews/:id', () => {
    test('owner deletes; rating resets to 0 / 0', async () => {
        const review = await seedReview({ booking: completed, rating: 4 });

        const res = await request(app).delete(`/api/v1/reviews/${review.id}`).set(auth(userA.token));

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual({});

        const updated = await Campground.findById(camp.id);
        expect(updated.averageRating).toBe(0);
        expect(updated.ratingCount).toBe(0);
    });

    test('admin deletes any review -> 200', async () => {
        const review = await seedReview({ booking: completed });

        const res = await request(app).delete(`/api/v1/reviews/${review.id}`).set(auth(admin.token));

        expect(res.status).toBe(200);
        expect(await Review.findById(review.id)).toBeNull();
    });

    test('another user -> 403', async () => {
        const review = await seedReview({ booking: completed });

        const res = await request(app).delete(`/api/v1/reviews/${review.id}`).set(auth(userB.token));

        expect(res.status).toBe(403);
    });
});
