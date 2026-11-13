const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Campground = require('../models/Campground');
const { getPagination } = require('../utils/pagination');

const populateUser = {
    path: 'user',
    select: 'name'
};

const isOwner = (review, user) => review.user.toString() === user.id;

const isOwnerOrAdmin = (review, user) =>
    isOwner(review, user) || user.role === 'admin';

//Map CastError/ValidationError to 400; returns true when the response was sent
const sendBadRequest = (err, res) => {
    if (err.name === 'ValidationError') {
        res.status(400).json({ success: false, message: err.message });
        return true;
    }
    if (err.name === 'CastError') {
        res.status(400).json({ success: false, message: 'Invalid id' });
        return true;
    }
    return false;
};

// @desc    Get reviews
// @route   GET /api/v1/reviews
// @route   GET /api/v1/campgrounds/:campgroundId/reviews
// @access  Public
exports.getReviews = async (req, res, next) => {
    try {
        const filter = {};

        if (req.params.campgroundId) {
            const campground = await Campground.findById(req.params.campgroundId);

            if (!campground) {
                return res.status(404).json({ success: false, message: `No campground with the id of ${req.params.campgroundId}` });
            }
            filter.campground = campground._id;
        }

        const total = await Review.countDocuments(filter);
        const { skip, limit, pagination } = getPagination(req.query, total);

        const reviews = await Review.find(filter)
            .populate(populateUser)
            .sort('-createdAt')
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: reviews.length,
            pagination,
            data: reviews
        });
    } catch (err) {
        console.log(err.stack);
        if (sendBadRequest(err, res)) return;
        res.status(500).json({ success: false, message: 'Cannot get reviews' });
    }
};

// @desc    Add review
// @route   POST /api/v1/campgrounds/:campgroundId/reviews
// @access  Private
exports.addReview = async (req, res, next) => {
    try {
        if (!req.params.campgroundId) {
            return res.status(400).json({ success: false, message: 'Please post reviews to /api/v1/campgrounds/:campgroundId/reviews' });
        }

        const campground = await Campground.findById(req.params.campgroundId);

        if (!campground) {
            return res.status(404).json({ success: false, message: `No campground with the id of ${req.params.campgroundId}` });
        }

        const { bookingId, rating, comment } = req.body;

        if (!bookingId) {
            return res.status(400).json({ success: false, message: 'Please provide a bookingId' });
        }

        //Stays that have ended become completed before we check the status
        await Booking.markCompleted({ _id: bookingId });

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${bookingId}` });
        }

        //Only the booking owner may review it
        if (booking.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to review this booking` });
        }

        if (booking.campground.toString() !== campground.id) {
            return res.status(400).json({ success: false, message: 'This booking is not for this campground' });
        }

        if (booking.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'You can only review after your stay' });
        }

        if (await Review.exists({ booking: booking._id })) {
            return res.status(400).json({ success: false, message: 'This booking has already been reviewed' });
        }

        //user and campground come from the token and the URL, never from the body
        const review = await Review.create({
            user: req.user.id,
            campground: campground._id,
            booking: booking._id,
            rating,
            comment
        });

        res.status(201).json({
            success: true,
            data: review
        });
    } catch (err) {
        console.log(err.stack);
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'This booking has already been reviewed' });
        }
        if (sendBadRequest(err, res)) return;
        res.status(500).json({ success: false, message: 'Cannot add review' });
    }
};

// @desc    Update review
// @route   PUT /api/v1/reviews/:id
// @access  Private
exports.updateReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ success: false, message: `No review with the id of ${req.params.id}` });
        }

        //Only the author may edit a review (admins can delete, not edit)
        if (!isOwner(review, req.user)) {
            return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to update this review` });
        }

        //Only rating and comment can change
        if (req.body.rating !== undefined) {
            review.rating = req.body.rating;
        }
        if (req.body.comment !== undefined) {
            review.comment = req.body.comment;
        }

        await review.save();

        res.status(200).json({
            success: true,
            data: review
        });
    } catch (err) {
        console.log(err.stack);
        if (sendBadRequest(err, res)) return;
        res.status(500).json({ success: false, message: 'Cannot update review' });
    }
};

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ success: false, message: `No review with the id of ${req.params.id}` });
        }

        if (!isOwnerOrAdmin(review, req.user)) {
            return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to delete this review` });
        }

        await review.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.log(err.stack);
        if (sendBadRequest(err, res)) return;
        res.status(500).json({ success: false, message: 'Cannot delete review' });
    }
};
