const request = require('supertest');
const app = require('../app');

test('GET /api/v1/campgrounds responds 200 with the list shape', async () => {
    const res = await request(app).get('/api/v1/campgrounds');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, count: 0, data: [] });
});

test('unknown route responds 404', async () => {
    expect((await request(app).get('/api/v1/nope')).status).toBe(404);
});
