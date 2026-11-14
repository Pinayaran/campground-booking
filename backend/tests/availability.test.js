const request = require('supertest');
const app = require('../app');
const { checkAvailability, findFullCampgroundIds } = require('../utils/availability');
const { daysFromToday } = require('../utils/dates');
const Campground = require('../models/Campground');
const { createUser, createCampground, createBooking } = require('./helpers');

const dateString = (offset) => daysFromToday(offset).toISOString().slice(0, 10);

describe('checkAvailability', () => {
    test('two overlapping bookings fill a capacity-2 campground', async () => {
        const camp = await createCampground({ capacity: 2 });
        await createBooking({ campground: camp, checkInDate: daysFromToday(5), nights: 2 });
        await createBooking({ campground: camp, checkInDate: daysFromToday(6), nights: 1 });

        expect(await checkAvailability(camp._id, daysFromToday(6), 1))
            .toEqual({ available: false, remaining: 0, capacity: 2, booked: 2 });
    });

    test('uses the busiest night of a multi-night stay', async () => {
        const camp = await createCampground({ capacity: 3 });
        await createBooking({ campground: camp, checkInDate: daysFromToday(5), nights: 2 });
        await createBooking({ campground: camp, checkInDate: daysFromToday(6), nights: 1 });

        expect(await checkAvailability(camp._id, daysFromToday(5), 3))
            .toEqual({ available: true, remaining: 1, capacity: 3, booked: 2 });
    });

    test('ignores cancelled bookings', async () => {
        const camp = await createCampground({ capacity: 1 });
        await createBooking({ campground: camp, checkInDate: daysFromToday(5), status: 'cancelled' });

        expect(await checkAvailability(camp._id, daysFromToday(5), 1))
            .toEqual({ available: true, remaining: 1, capacity: 1, booked: 0 });
    });

    test('ignores excludeBookingId', async () => {
        const camp = await createCampground({ capacity: 1 });
        const booking = await createBooking({ campground: camp, checkInDate: daysFromToday(5) });

        const result = await checkAvailability(camp._id, daysFromToday(5), 1, booking._id);
        expect(result.available).toBe(true);
        expect(result.booked).toBe(0);
    });

    test('a stay that checks out on the check-in day does not overlap', async () => {
        const camp = await createCampground({ capacity: 1 });
        await createBooking({ campground: camp, checkInDate: daysFromToday(3), nights: 2 });

        expect((await checkAvailability(camp._id, daysFromToday(5), 1)).booked).toBe(0);
    });

    test('unknown campground is unavailable', async () => {
        expect(await checkAvailability('000000000000000000000000', daysFromToday(5), 1))
            .toEqual({ available: false, remaining: 0, capacity: 0, booked: 0 });
    });
});

describe('findFullCampgroundIds', () => {
    test('returns a campground that has reached capacity', async () => {
        const camp = await createCampground({ capacity: 1 });
        await createBooking({ campground: camp, checkInDate: daysFromToday(5) });

        const ids = await findFullCampgroundIds(daysFromToday(5));
        expect(ids.map(String)).toEqual([String(camp._id)]);
    });

    test('does not return a campground with free space', async () => {
        const camp = await createCampground({ capacity: 2 });
        await createBooking({ campground: camp, checkInDate: daysFromToday(5) });

        expect(await findFullCampgroundIds(daysFromToday(5))).toEqual([]);
    });

    test('ignores cancelled bookings', async () => {
        const camp = await createCampground({ capacity: 1 });
        await createBooking({ campground: camp, checkInDate: daysFromToday(5), status: 'cancelled' });

        expect(await findFullCampgroundIds(daysFromToday(5))).toEqual([]);
    });

    test('ignores a booking that checks out on the date', async () => {
        const camp = await createCampground({ capacity: 1 });
        await createBooking({ campground: camp, checkInDate: daysFromToday(3), nights: 2 });

        expect(await findFullCampgroundIds(daysFromToday(5))).toEqual([]);
    });
});

describe('GET /campgrounds/:id/availability', () => {
    test('returns the date summary', async () => {
        const camp = await createCampground({ capacity: 2 });
        await createBooking({ campground: camp, checkInDate: daysFromToday(5) });
        const date = dateString(5);

        const res = await request(app).get(`/api/v1/campgrounds/${camp._id}/availability?date=${date}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual({ date, capacity: 2, booked: 1, remaining: 1, available: true });
    });

    test.each([[''], ['?date=2026-02-30'], ['?date=12/01/2026']])('bad date %p -> 400', async (query) => {
        const camp = await createCampground();
        const res = await request(app).get(`/api/v1/campgrounds/${camp._id}/availability${query}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Please provide a valid date (YYYY-MM-DD)');
    });

    test('unknown campground -> 404', async () => {
        const res = await request(app).get(`/api/v1/campgrounds/000000000000000000000000/availability?date=${dateString(5)}`);

        expect(res.status).toBe(404);
    });

    test('malformed id -> 400', async () => {
        const res = await request(app).get(`/api/v1/campgrounds/abc/availability?date=${dateString(5)}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid campground id');
    });

    test('unexpected error -> 500', async () => {
        const camp = await createCampground();
        const findById = jest.spyOn(Campground, 'findById').mockImplementation(() => { throw new Error('boom'); });
        const log = jest.spyOn(console, 'log').mockImplementation(() => {});

        try {
            const res = await request(app).get(`/api/v1/campgrounds/${camp._id}/availability?date=${dateString(5)}`);

            expect(res.status).toBe(500);
            expect(res.body).toEqual({ success: false, message: 'Cannot check availability' });
        } finally {
            findById.mockRestore();
            log.mockRestore();
        }
    });
});

describe('bookings respect capacity', () => {
    test('POST booking on a full night -> 400', async () => {
        const camp = await createCampground({ capacity: 1 });
        await createBooking({ campground: camp, checkInDate: daysFromToday(7) });
        const { token } = await createUser();

        const res = await request(app)
            .post(`/api/v1/campgrounds/${camp._id}/bookings`)
            .set('Authorization', `Bearer ${token}`)
            .send({ checkInDate: dateString(7), nights: 1 });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Campground is fully booked for the selected dates');
    });

    test('PUT own booking does not count against itself -> 200', async () => {
        const camp = await createCampground({ capacity: 1 });
        const { user, token } = await createUser();
        const booking = await createBooking({ user, campground: camp, checkInDate: daysFromToday(7), nights: 1 });

        const res = await request(app)
            .put(`/api/v1/bookings/${booking._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ nights: 2 });

        expect(res.status).toBe(200);
    });

    test('PUT moving a booking onto a full night -> 400', async () => {
        const camp = await createCampground({ capacity: 1 });
        await createBooking({ campground: camp, checkInDate: daysFromToday(7) });
        const { user, token } = await createUser();
        const booking = await createBooking({ user, campground: camp, checkInDate: daysFromToday(10) });

        const res = await request(app)
            .put(`/api/v1/bookings/${booking._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ checkInDate: dateString(7) });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Campground is fully booked for the selected dates');
    });
});
