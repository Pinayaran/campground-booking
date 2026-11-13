const request = require('supertest');
const app = require('../app');
const { createUser, createCampground } = require('./helpers');

const validBody = (overrides = {}) => ({
    name: 'Fields Camp',
    address: '1 Camp Road',
    tel: '0211111111',
    province: 'Chiang Mai',
    region: 'North',
    ...overrides
});

test('creates a campground with detail fields and defaults', async () => {
    const { token } = await createUser({ role: 'admin' });
    const res = await request(app)
        .post('/api/v1/campgrounds')
        .set('Authorization', `Bearer ${token}`)
        .send(validBody({ description: 'Lakeside camp', facilities: ['Toilet'], rules: ['No fires'] }));

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
        province: 'Chiang Mai',
        region: 'North',
        description: 'Lakeside camp',
        capacity: 10,
        facilities: ['Toilet'],
        rules: ['No fires'],
        images: [],
        averageRating: 0,
        ratingCount: 0
    });
});

test.each([
    ['missing province', { province: undefined }],
    ['unknown region', { region: 'Mars' }],
    ['capacity 0', { capacity: 0 }],
    ['capacity 1.5', { capacity: 1.5 }]
])('%s -> 400', async (_, override) => {
    const { token } = await createUser({ role: 'admin' });
    const res = await request(app)
        .post('/api/v1/campgrounds')
        .set('Authorization', `Bearer ${token}`)
        .send(validBody(override));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
});

test('averageRating and ratingCount in the body are ignored on create and update', async () => {
    const { token } = await createUser({ role: 'admin' });
    const created = await request(app)
        .post('/api/v1/campgrounds')
        .set('Authorization', `Bearer ${token}`)
        .send(validBody({ averageRating: 5, ratingCount: 99 }));

    expect(created.status).toBe(201);
    expect(created.body.data.averageRating).toBe(0);
    expect(created.body.data.ratingCount).toBe(0);

    const campground = await createCampground();
    const updated = await request(app)
        .put(`/api/v1/campgrounds/${campground._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ averageRating: 5, ratingCount: 99 });

    expect(updated.status).toBe(200);
    expect(updated.body.data.averageRating).toBe(0);
    expect(updated.body.data.ratingCount).toBe(0);
});

test('validators run on update: unknown region -> 400', async () => {
    const { token } = await createUser({ role: 'admin' });
    const campground = await createCampground();
    const res = await request(app)
        .put(`/api/v1/campgrounds/${campground._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ region: 'Mars' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
});
