const request = require('supertest');
const app = require('../app');
const Campground = require('../models/Campground');
const { REGIONS } = require('../config/regions');
const { daysFromToday } = require('../utils/dates');
const { createCampground, createBooking } = require('./helpers');

const day7 = () => daysFromToday(7).toISOString().slice(0, 10);
const names = res => res.body.data.map(c => c.name);

describe('GET /api/v1/campgrounds filters', () => {
    beforeEach(async () => {
        await createCampground({ name: 'Doi Inthanon Camp', province: 'Chiang Mai', region: 'North', capacity: 2 });
        await createCampground({ name: 'Khao Yai Pine Camp', province: 'Nakhon Ratchasima', region: 'Northeast', capacity: 2 });
        const krabi = await createCampground({ name: 'Krabi Cliff Camp', province: 'Krabi', region: 'South', capacity: 1 });
        await createBooking({ campground: krabi, checkInDate: daysFromToday(7), nights: 1 });
    });

    test('province is case-insensitive and trimmed', async () => {
        const res = await request(app).get('/api/v1/campgrounds?province=%20chiang%20mai%20');
        expect(res.status).toBe(200);
        expect(names(res)).toEqual(['Doi Inthanon Camp']);
    });

    test('region filter', async () => {
        const res = await request(app).get('/api/v1/campgrounds?region=north');
        expect(res.status).toBe(200);
        expect(names(res)).toEqual(['Doi Inthanon Camp']);
    });

    test('search matches part of the name', async () => {
        const res = await request(app).get('/api/v1/campgrounds?search=PINE');
        expect(names(res)).toEqual(['Khao Yai Pine Camp']);
    });

    test.each(['(', '.*'])('search %p is literal -> 200, count 0', async (term) => {
        const res = await request(app).get(`/api/v1/campgrounds?search=${encodeURIComponent(term)}`);
        expect(res.status).toBe(200);
        expect(res.body.count).toBe(0);
    });

    test('filters combine', async () => {
        const res = await request(app).get('/api/v1/campgrounds?region=North&search=pine');
        expect(res.status).toBe(200);
        expect(res.body.count).toBe(0);
    });

    test('date removes full campgrounds before paging', async () => {
        const res = await request(app).get(`/api/v1/campgrounds?date=${day7()}&limit=1&page=2`);
        expect(res.status).toBe(200);
        expect(res.body.count).toBe(1);
        expect(res.body.pagination).toEqual({ prev: { page: 1, limit: 1 } });
        expect(names(res)).not.toContain('Krabi Cliff Camp');
    });

    test('date does not overwrite an _id filter', async () => {
        const full = await Campground.findOne({ name: 'Krabi Cliff Camp' });
        const free = await Campground.findOne({ name: 'Doi Inthanon Camp' });

        const onFull = await request(app).get(`/api/v1/campgrounds?_id=${full.id}&date=${day7()}`);
        const onFree = await request(app).get(`/api/v1/campgrounds?_id=${free.id}&date=${day7()}`);

        expect(onFull.body.count).toBe(0);
        expect(onFree.body.count).toBe(1);
        expect(names(onFree)).toEqual(['Doi Inthanon Camp']);
    });

    test('search does not overwrite a name filter', async () => {
        const res = await request(app).get('/api/v1/campgrounds?name=Doi%20Inthanon%20Camp&search=pine');
        expect(res.status).toBe(200);
        expect(res.body.count).toBe(0);
    });

    test('invalid date -> 400', async () => {
        const res = await request(app).get('/api/v1/campgrounds?date=tomorrow');
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Please provide a valid date (YYYY-MM-DD)');
    });

    test.each(['province[$ne]=x', 'search[$regex]=.*', 'region=North&region=South'])(
        'non-string named filter %p -> 400 "Invalid query"', async (qs) => {
            const res = await request(app).get(`/api/v1/campgrounds?${qs}`);
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid query');
        });

    test.each(['sort=name&sort=tel', 'select[x]=1'])(
        'non-string select/sort %p -> 400 "Invalid query"', async (qs) => {
            const res = await request(app).get(`/api/v1/campgrounds?${qs}`);
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid query');
        });

    test('existing operator passthrough still works', async () => {
        const res = await request(app).get('/api/v1/campgrounds?capacity[gte]=2');
        expect(res.status).toBe(200);
        expect(names(res).sort()).toEqual(['Doi Inthanon Camp', 'Khao Yai Pine Camp']);
    });

    test('existing passthrough still rejects bad operators', async () => {
        const res = await request(app).get('/api/v1/campgrounds?capacity[$where]=1');
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid query');
    });

    test('uncastable filter value -> 400 "Invalid query"', async () => {
        const res = await request(app).get('/api/v1/campgrounds?capacity[gte]=abc');
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid query');
    });

    test('unexpected failure -> 500', async () => {
        const spy = jest.spyOn(Campground, 'countDocuments').mockRejectedValue(new Error('db down'));
        try {
            const res = await request(app).get('/api/v1/campgrounds');
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ success: false, message: 'Cannot get campgrounds' });
        } finally {
            spy.mockRestore();
        }
    });

    test('GET /campgrounds/locations', async () => {
        const res = await request(app).get('/api/v1/campgrounds/locations');
        expect(res.status).toBe(200);
        expect(res.body.data).toEqual({ regions: REGIONS, provinces: ['Chiang Mai', 'Krabi', 'Nakhon Ratchasima'] });
    });
});
