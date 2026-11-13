//Capacity helpers: how many bookings occupy a campground on each night.
//A booking occupies the nights checkInDate <= night < checkOutDate (the check-out day is free).
const Booking = require('../models/Booking');
const Campground = require('../models/Campground');
const { addDays } = require('./dates');

//Busiest night of the stay decides availability. excludeBookingId lets a booking be edited without blocking itself.
exports.checkAvailability = async (campgroundId, checkInDate, nights, excludeBookingId) => {
    const campground = await Campground.findById(campgroundId).select('capacity');
    if (!campground) {
        return { available: false, remaining: 0, capacity: 0, booked: 0 };
    }

    const checkOutDate = addDays(checkInDate, nights);
    const bookings = await Booking.find({
        campground: campgroundId,
        status: { $ne: 'cancelled' },
        checkInDate: { $lt: checkOutDate },
        checkOutDate: { $gt: checkInDate },
        ...(excludeBookingId && { _id: { $ne: excludeBookingId } })
    }).select('checkInDate checkOutDate');

    let booked = 0;
    for (let i = 0; i < nights; i++) {
        const night = addDays(checkInDate, i);
        const count = bookings.filter(b => b.checkInDate <= night && night < b.checkOutDate).length;
        booked = Math.max(booked, count);
    }

    const remaining = Math.max(campground.capacity - booked, 0);
    return { available: remaining > 0, remaining, capacity: campground.capacity, booked };
};

//Ids of campgrounds with no free space on the night of `date`
exports.findFullCampgroundIds = async (date) => {
    const counts = await Booking.aggregate([
        { $match: { status: { $ne: 'cancelled' }, checkInDate: { $lte: date }, checkOutDate: { $gt: date } } },
        { $group: { _id: '$campground', booked: { $sum: 1 } } }
    ]);
    if (counts.length === 0) return [];

    const campgrounds = await Campground.find({ _id: { $in: counts.map(c => c._id) } }).select('capacity');
    const capacityById = new Map(campgrounds.map(c => [String(c._id), c.capacity]));

    return counts.filter(c => c.booked >= capacityById.get(String(c._id))).map(c => c._id);
};
