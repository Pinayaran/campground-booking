const User = require('../models/User');
const Campground = require('../models/Campground');
const Booking = require('../models/Booking');
const { addDays } = require('../utils/dates');

let counter = 0;
const next = () => ++counter;

//Create a user (password hash hook runs) and a signed JWT for it
const createUser = async ({ role = 'user', ...overrides } = {}) => {
    const n = next();
    const user = await User.create({
        name: `Test User ${n}`,
        tel: '0812345678',
        email: `user${n}@test.com`,
        password: 'password123',
        role,
        ...overrides
    });
    return { user, token: user.getSignedJwtToken() };
};

//Valid campground with the required location fields; override any field per test
const createCampground = (overrides = {}) => {
    const n = next();
    return Campground.create({
        name: `Test Campground ${n}`,
        address: '1 Camp Road',
        tel: '0211111111',
        province: 'Chiang Mai',
        region: 'North',
        capacity: 2,
        ...overrides
    });
};

//Direct Booking.create so tests can seed past/full bookings without controller rules
const createBooking = async ({ user, campground, checkInDate, nights = 1, status } = {}) => {
    const owner = user || (await createUser()).user;
    const site = campground || await createCampground();
    return Booking.create({
        user: owner._id,
        campground: site._id,
        checkInDate: checkInDate || addDays(new Date(), 7),
        nights,
        ...(status && { status })
    });
};

module.exports = { createUser, createCampground, createBooking };
