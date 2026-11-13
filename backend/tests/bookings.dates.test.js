const request = require('supertest');
const app = require('../app');
const { daysFromToday } = require('../utils/dates');
const { createUser, createCampground } = require('./helpers');

const day = (n) => daysFromToday(n).toISOString().slice(0, 10);
const INVALID_DATE = 'Please provide a valid check-in date (YYYY-MM-DD)';

const post = (token, campgroundId, body) =>
    request(app)
        .post(`/api/v1/campgrounds/${campgroundId}/bookings`)
        .set('Authorization', `Bearer ${token}`)
        .send(body);

const put = (token, id, body) =>
    request(app)
        .put(`/api/v1/bookings/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(body);

describe('booking check-in date format', () => {
    test('POST with YYYY-MM-DD -> 201 and checkInDate stored at midnight UTC', async () => {
        const { token } = await createUser();
        const camp = await createCampground();

        const res = await post(token, camp._id, { checkInDate: day(10), nights: 1 });

        expect(res.status).toBe(201);
        expect(res.body.data.checkInDate).toBe(`${day(10)}T00:00:00.000Z`);
    });

    test.each([`${day(10)}T15:00:00Z`, '11/20/2026', '2026-02-30', 20261120])(
        'POST with checkInDate %p -> 400 invalid date',
        async (checkInDate) => {
            const { token } = await createUser();
            const camp = await createCampground();

            const res = await post(token, camp._id, { checkInDate, nights: 1 });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe(INVALID_DATE);
        }
    );

    test('PUT with a datetime checkInDate -> 400', async () => {
        const { token } = await createUser();
        const camp = await createCampground();
        const created = await post(token, camp._id, { checkInDate: day(10), nights: 1 });

        const res = await put(token, created.body.data._id, { checkInDate: `${day(11)}T15:00:00Z` });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(INVALID_DATE);
    });

    test('PUT changing only nights still works -> 200', async () => {
        const { token } = await createUser();
        const camp = await createCampground();
        const created = await post(token, camp._id, { checkInDate: day(10), nights: 1 });

        const res = await put(token, created.body.data._id, { nights: 2 });

        expect(res.status).toBe(200);
        expect(res.body.data.nights).toBe(2);
    });

    test('PUT with a new YYYY-MM-DD date -> 200 and stored at midnight UTC', async () => {
        const { token } = await createUser();
        const camp = await createCampground();
        const created = await post(token, camp._id, { checkInDate: day(10), nights: 1 });

        const res = await put(token, created.body.data._id, { checkInDate: day(12) });

        expect(res.status).toBe(200);
        expect(res.body.data.checkInDate).toBe(`${day(12)}T00:00:00.000Z`);
    });
});
