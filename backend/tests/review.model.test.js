const Review = require('../models/Review');
const Campground = require('../models/Campground');
const { createCampground, createBooking } = require('./helpers');
const { daysFromToday } = require('../utils/dates');

//Each review needs its own booking because booking is unique
const makeReview = async (campground, rating) => {
    const booking = await createBooking({
        campground,
        checkInDate: daysFromToday(-5),
        status: 'completed'
    });
    return Review.create({
        user: booking.user,
        campground: campground._id,
        booking: booking._id,
        rating
    });
};

const makeBase = async (campground) => {
    const booking = await createBooking({
        campground,
        checkInDate: daysFromToday(-5),
        status: 'completed'
    });
    return { user: booking.user, campground: campground._id, booking: booking._id };
};

const reload = (campground) => Campground.findById(campground._id);

describe('Review model', () => {
    test('average of 4 and 5 is 4.5 with count 2', async () => {
        const campground = await createCampground();
        await makeReview(campground, 4);
        await makeReview(campground, 5);
        const updated = await reload(campground);
        expect(updated.averageRating).toBe(4.5);
        expect(updated.ratingCount).toBe(2);
    });

    test('rounds to one decimal: 5, 4, 4 -> 4.3', async () => {
        const campground = await createCampground();
        await makeReview(campground, 5);
        await makeReview(campground, 4);
        await makeReview(campground, 4);
        const updated = await reload(campground);
        expect(updated.averageRating).toBe(4.3);
        expect(updated.ratingCount).toBe(3);
    });

    test('editing a rating with save() recalculates', async () => {
        const campground = await createCampground();
        const review = await makeReview(campground, 2);
        expect((await reload(campground)).averageRating).toBe(2);
        review.rating = 5;
        await review.save();
        const updated = await reload(campground);
        expect(updated.averageRating).toBe(5);
        expect(updated.ratingCount).toBe(1);
    });

    test('deleting the only review resets to 0 / 0', async () => {
        const campground = await createCampground();
        const review = await makeReview(campground, 4);
        expect((await reload(campground)).ratingCount).toBe(1);
        await review.deleteOne();
        const updated = await reload(campground);
        expect(updated.averageRating).toBe(0);
        expect(updated.ratingCount).toBe(0);
    });

    test.each([0, 6, 4.5])('rating %p is rejected', async (rating) => {
        const campground = await createCampground();
        const base = await makeBase(campground);
        await expect(Review.create({ ...base, rating })).rejects.toThrow(/rating/i);
    });

    test('rating "4" is stored as 4', async () => {
        const campground = await createCampground();
        const base = await makeBase(campground);
        const review = await Review.create({ ...base, rating: '4' });
        expect(review.rating).toBe(4);
    });

    test('a second review for the same booking fails with code 11000', async () => {
        const campground = await createCampground();
        const base = await makeBase(campground);
        await Review.create({ ...base, rating: 4 });
        await expect(Review.create({ ...base, rating: 5 })).rejects.toMatchObject({ code: 11000 });
    });

    test('comment longer than 500 characters is rejected', async () => {
        const campground = await createCampground();
        const base = await makeBase(campground);
        await expect(
            Review.create({ ...base, rating: 4, comment: 'a'.repeat(501) })
        ).rejects.toThrow(/comment/i);
    });

    test('comment of 500 characters is accepted and stored trimmed', async () => {
        const campground = await createCampground();
        const base = await makeBase(campground);
        const review = await Review.create({ ...base, rating: 4, comment: `  ${'a'.repeat(500)}  ` });
        expect(review.comment).toBe('a'.repeat(500));
    });
});
