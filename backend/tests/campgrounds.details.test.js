const request = require('supertest');
const app = require('../app');
const { daysFromToday } = require('../utils/dates');
const Campground = require('../models/Campground');
const Review = require('../models/Review');
const { createUser, createCampground, createBooking } = require('./helpers');

//Review created straight in the DB, one completed booking per review
const seedReview = async ({ user, campground, comment, createdAt, rating = 4 }) => {
    const booking = await createBooking({ user, campground, checkInDate: daysFromToday(-5), status: 'completed' });
    return Review.create({ user: user._id, campground: campground._id, booking: booking._id, rating, comment, createdAt });
};

test('returns description, facilities, rules and rating fields', async () => {
    const camp = await createCampground({ description: 'Lakeside camp', facilities: ['Toilet'], rules: ['No fires'] });

    const res = await request(app).get(`/api/v1/campgrounds/${camp.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
        description: 'Lakeside camp',
        facilities: ['Toilet'],
        rules: ['No fires'],
        averageRating: 0,
        ratingCount: 0
    });
});

test('includes the 10 newest reviews with reviewer name only', async () => {
    const { user } = await createUser();
    const camp = await createCampground();
    for (let i = 1; i <= 11; i++) {
        await seedReview({ user, campground: camp, comment: `review ${i}`, createdAt: new Date(Date.now() - (11 - i) * 1000) });
    }

    const res = await request(app).get(`/api/v1/campgrounds/${camp.id}`);

    expect(res.status).toBe(200);
    const { reviews } = res.body.data;
    expect(reviews).toHaveLength(10);
    expect(reviews[0].comment).toBe('review 11');
    expect(reviews[9].comment).toBe('review 2');
    expect(reviews[0].user).toEqual({ _id: user.id, name: user.name });
});

test('campground list does not include reviews', async () => {
    const { user } = await createUser();
    const camp = await createCampground();
    await seedReview({ user, campground: camp, comment: 'hello' });

    const res = await request(app).get('/api/v1/campgrounds');

    expect(res.status).toBe(200);
    expect(res.body.data[0].reviews).toBeUndefined();
});

test('deleting a campground deletes its reviews only', async () => {
    const { token } = await createUser({ role: 'admin' });
    const { user } = await createUser();
    const camp = await createCampground();
    const other = await createCampground();
    await seedReview({ user, campground: camp, comment: 'gone' });
    await seedReview({ user, campground: other, comment: 'stays' });

    const res = await request(app).delete(`/api/v1/campgrounds/${camp.id}`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(await Review.countDocuments({ campground: camp._id })).toBe(0);
    expect(await Review.countDocuments({ campground: other._id })).toBe(1);
});

test('malformed id returns 400 for GET and DELETE', async () => {
    const { token } = await createUser({ role: 'admin' });

    const get = await request(app).get('/api/v1/campgrounds/abc');
    const del = await request(app).delete('/api/v1/campgrounds/abc').set('Authorization', `Bearer ${token}`);

    expect(get.status).toBe(400);
    expect(del.status).toBe(400);
});

test('unexpected error on GET returns 500', async () => {
    const spy = jest.spyOn(Campground, 'findById').mockReturnValue({ populate: () => Promise.reject(new Error('db down')) });
    jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
        const res = await request(app).get('/api/v1/campgrounds/507f1f77bcf86cd799439011');
        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Cannot get campground');
    } finally {
        spy.mockRestore();
        console.log.mockRestore();
    }
});
