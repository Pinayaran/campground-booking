const Booking = require('../models/Booking');
const Campground = require('../models/Campground');
const { checkAvailability } = require('../utils/availability');
const { parseDateOnly } = require('../utils/dates');

const populateCampground = {
    path: 'campground',
    select: 'name address tel'
};

const isOwnerOrAdmin = (booking, user) =>
    booking.user.toString() === user.id || user.role === 'admin';

//Validate the parsed check-in Date (null = invalid) and nights. Returns an error message or null.
const validateStay = (date, nights) => {
    if (!date) {
        return 'Please provide a valid check-in date (YYYY-MM-DD)';
    }

    const n = Number(nights);
    if (!Number.isInteger(n) || n < 1 || n > 3) {
        return 'Nights must be a whole number from 1 to 3';
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (date < today) {
        return 'Check-in date can not be in the past';
    }

    return null;
};

// @desc    Get all bookings
// @route   GET /api/v1/bookings
// @route   GET /api/v1/campgrounds/:campgroundId/bookings
// @access  Private
exports.getBookings = async (req, res, next) => {
    try {
        const filter = {};

        if (req.user.role !== 'admin') { //General users can see only their bookings!
            filter.user = req.user.id;
        }
        if (req.params.campgroundId) {
            filter.campground = req.params.campgroundId;
        }

        await Booking.markCompleted(filter);

        const bookings = await Booking.find(filter)
            .populate(populateCampground)
            .sort('checkInDate');

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (err) {
        console.log(err.stack);
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid campground id' });
        }
        res.status(500).json({ success: false, message: 'Cannot find bookings' });
    }
};

// @desc    Get single booking
// @route   GET /api/v1/bookings/:id
// @access  Private
exports.getBooking = async (req, res, next) => {
    try {
        await Booking.markCompleted({ _id: req.params.id });

        const booking = await Booking.findById(req.params.id).populate(populateCampground);

        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}` });
        }

        //Make sure user is the booking owner
        if (!isOwnerOrAdmin(booking, req.user)) {
            return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to view this booking` });
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (err) {
        console.log(err.stack);
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid booking id' });
        }
        res.status(500).json({ success: false, message: 'Cannot find booking' });
    }
};

// @desc    Add booking
// @route   POST /api/v1/campgrounds/:campgroundId/bookings
// @access  Private
exports.addBooking = async (req, res, next) => {
    try {
        const campground = await Campground.findById(req.params.campgroundId);

        if (!campground) {
            return res.status(404).json({ success: false, message: `No campground with the id of ${req.params.campgroundId}` });
        }

        const { nights } = req.body;
        const date = parseDateOnly(req.body.checkInDate);

        const error = validateStay(date, nights);
        if (error) {
            return res.status(400).json({ success: false, message: error });
        }

        const { available } = await checkAvailability(campground._id, date, Number(nights));
        if (!available) {
            return res.status(400).json({ success: false, message: 'Campground is fully booked for the selected dates' });
        }

        //user always comes from the token, never from the body
        const booking = await Booking.create({
            user: req.user.id,
            campground: campground._id,
            checkInDate: date,
            nights
        });

        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (err) {
        console.log(err.stack);
        if (err.name === 'ValidationError' || err.name === 'CastError') {
            return res.status(400).json({ success: false, message: err.message });
        }
        res.status(500).json({ success: false, message: 'Cannot create booking' });
    }
};

// @desc    Update booking
// @route   PUT /api/v1/bookings/:id
// @access  Private
exports.updateBooking = async (req, res, next) => {
    try {
        await Booking.markCompleted({ _id: req.params.id });

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}` });
        }

        //Make sure user is the booking owner
        if (!isOwnerOrAdmin(booking, req.user)) {
            return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to update this booking` });
        }

        const date = req.body.checkInDate !== undefined ? parseDateOnly(req.body.checkInDate) : booking.checkInDate;
        const nights = req.body.nights !== undefined ? req.body.nights : booking.nights;
        const datesChanged = req.body.checkInDate !== undefined || req.body.nights !== undefined;

        if (datesChanged) {
            if (booking.status !== 'upcoming') {
                return res.status(400).json({ success: false, message: `Can not change the dates of a ${booking.status} booking` });
            }

            const error = validateStay(date, nights);
            if (error) {
                return res.status(400).json({ success: false, message: error });
            }

            const { available } = await checkAvailability(booking.campground, date, Number(nights), booking._id);
            if (!available) {
                return res.status(400).json({ success: false, message: 'Campground is fully booked for the selected dates' });
            }

            booking.checkInDate = date;
            booking.nights = nights;
        }

        //Only admins may change status; nobody may change user or campground here
        if (req.body.status !== undefined) {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Only admins can change booking status' });
            }
            booking.status = req.body.status;
        }

        await booking.save();

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (err) {
        console.log(err.stack);
        if (err.name === 'ValidationError' || err.name === 'CastError') {
            return res.status(400).json({ success: false, message: err.message });
        }
        res.status(500).json({ success: false, message: 'Cannot update booking' });
    }
};

// @desc    Delete booking
// @route   DELETE /api/v1/bookings/:id
// @access  Private
exports.deleteBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}` });
        }

        //Make sure user is the booking owner
        if (!isOwnerOrAdmin(booking, req.user)) {
            return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to delete this booking` });
        }

        await booking.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.log(err.stack);
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid booking id' });
        }
        res.status(500).json({ success: false, message: 'Cannot delete booking' });
    }
};
