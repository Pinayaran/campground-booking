// Seed / clear the database.
//   node seeder -i   import sample users, campgrounds and bookings (clears existing data first)
//   node seeder -d   destroy all users, campgrounds, bookings (and reviews, once the model exists)
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, 'config', 'config.env'), quiet: true });

const User = require('./models/User');
const Campground = require('./models/Campground');
const Booking = require('./models/Booking');

//Review model is added by Lala (L6); clear it too when it exists
let Review = null;
try {
    Review = require('./models/Review');
} catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') throw err;
}

const DAY_MS = 24 * 60 * 60 * 1000;

//Midnight UTC, `offset` days from today
const day = offset => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return new Date(d.getTime() + offset * DAY_MS);
};

//Demo accounts (password for all: 123456). Admins can only be created here.
const users = [
    { name: 'Admin', tel: '0800000000', email: 'admin@gmail.com', password: '123456', role: 'admin' },
    { name: 'User One', tel: '0811111111', email: 'user1@gmail.com', password: '123456', role: 'user' },
    { name: 'User Two', tel: '0822222222', email: 'user2@gmail.com', password: '123456', role: 'user' }
];

//Required fields only; details, capacity and more campgrounds are added in L8
const campgrounds = [
    { name: 'Doi Inthanon Camp', address: 'Ban Luang, Chom Thong, Chiang Mai 50160', tel: '053000001', province: 'Chiang Mai', region: 'North' },
    { name: 'Khao Yai Pine Camp', address: 'Mu Si, Pak Chong, Nakhon Ratchasima 30130', tel: '044000002', province: 'Nakhon Ratchasima', region: 'Northeast' },
    { name: 'Erawan Riverside Camp', address: 'Tha Kradan, Si Sawat, Kanchanaburi 71250', tel: '034000003', province: 'Kanchanaburi', region: 'West' }
];

const importData = async () => {
    await destroyData(false);

    //create() (not insertMany) so the password hash hook runs
    const [admin, user1, user2] = await User.create(users);
    const [inthanon, khaoYai, erawan] = await Campground.create(campgrounds);

    await Booking.create([
        //Past stays (completed) so reviews can be tested
        { user: user1._id, campground: inthanon._id, checkInDate: day(-10), nights: 2, status: 'completed' },
        { user: user2._id, campground: khaoYai._id, checkInDate: day(-7), nights: 3, status: 'completed' },
        //Upcoming stays
        { user: user1._id, campground: khaoYai._id, checkInDate: day(7), nights: 1 },
        { user: user1._id, campground: erawan._id, checkInDate: day(14), nights: 3 },
        { user: user2._id, campground: inthanon._id, checkInDate: day(10), nights: 2 },
        //Cancelled
        { user: user2._id, campground: erawan._id, checkInDate: day(5), nights: 1, status: 'cancelled' }
    ]);

    console.log('Data imported');
    console.log('  admin@gmail.com / 123456 (admin)');
    console.log('  user1@gmail.com / 123456');
    console.log('  user2@gmail.com / 123456');
};

const destroyData = async (log = true) => {
    if (Review) await Review.deleteMany();
    await Booking.deleteMany();
    await Campground.deleteMany();
    await User.deleteMany();
    if (log) console.log('Data destroyed');
};

const run = async () => {
    const flag = process.argv[2];
    if (flag !== '-i' && flag !== '-d') {
        console.log('Usage: node seeder -i (import) | node seeder -d (destroy)');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        //Make sure unique indexes exist before inserting
        await Promise.all([User.init(), Campground.init(), Booking.init()]);

        if (flag === '-i') await importData();
        else await destroyData();
    } catch (err) {
        console.error(err);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

run();
