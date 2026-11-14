const request = require('supertest');
const app = require('../app');
const Review = require('../models/Review');
const Campground = require('../models/Campground');
const { daysFromToday } = require('../utils/dates');
const { createUser, createCampground, createBooking } = require('./helpers');

describe('DELETE /api/v1/bookings/:id', () => {
    test('deletes the booking review and resets the campground rating', async () => {
        const { user, token } = await createUser();
        const campground = await createCampground();
        const booking = await createBooking({
            user,
            campground,
            checkInDate: daysFromToday(-5),
            status: 'completed'
        });
        const review = await Review.create({ user: user._id, campground: campground._id, booking: booking._id, rating: 4 });
        expect((await Campground.findById(campground._id)).averageRating).toBe(4);

        const res = await request(app)
            .delete(`/api/v1/bookings/${booking.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(await Review.findById(review._id)).toBeNull();
        const after = await Campground.findById(campground._id);
        expect(after.averageRating).toBe(0);
        expect(after.ratingCount).toBe(0);
    });
});
