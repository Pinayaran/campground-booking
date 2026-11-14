// Seed / clear the database.
//   node seeder -i   import sample users, campgrounds, bookings and reviews (clears existing data first)
//   node seeder -d   destroy all users, campgrounds, bookings, reviews and revoked tokens
//A non-local MONGO_URI is refused unless --force is added, e.g. node seeder -i --force
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, 'config', 'config.env'), quiet: true });

const User = require('./models/User');
const Campground = require('./models/Campground');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const RevokedToken = require('./models/RevokedToken');
const { daysFromToday } = require('./utils/dates');
const { isLocalMongoUri, describeMongoHosts } = require('./utils/mongoUri');

//Demo accounts (password for all: 123456). Admins can only be created here.
const users = [
    { name: 'Admin', tel: '0800000000', email: 'admin@gmail.com', password: '123456', role: 'admin' },
    { name: 'User One', tel: '0811111111', email: 'user1@gmail.com', password: '123456', role: 'user' },
    { name: 'User Two', tel: '0822222222', email: 'user2@gmail.com', password: '123456', role: 'user' }
];

//10 campgrounds across 8 provinces and all 6 regions, with every detail field filled.
//images stays empty: the frontend shows a placeholder.
const campgrounds = [
    {
        name: 'Doi Inthanon Camp', address: 'Ban Luang, Chom Thong, Chiang Mai 50160', tel: '0530000001',
        province: 'Chiang Mai', region: 'North', capacity: 12,
        description: 'Cool mountain campsite near the highest peak in Thailand, with misty mornings and waterfall walks.',
        facilities: ['Toilets', 'Hot showers', 'Parking', 'Fire pit'],
        rules: ['Quiet hours 22:00-06:00', 'No littering', 'Keep fires in the fire pit']
    },
    {
        name: 'Khao Yai Pine Camp', address: 'Mu Si, Pak Chong, Nakhon Ratchasima 30130', tel: '0440000002',
        province: 'Nakhon Ratchasima', region: 'Northeast', capacity: 20,
        description: 'Pine forest campground at the edge of Khao Yai National Park, popular for wildlife spotting.',
        facilities: ['Toilets', 'Showers', 'Parking', 'Electricity', 'Barbecue area'],
        rules: ['Do not feed wildlife', 'Quiet hours 22:00-06:00', 'Pets must be on a leash']
    },
    {
        name: 'Erawan Riverside Camp', address: 'Tha Kradan, Si Sawat, Kanchanaburi 71250', tel: '0340000003',
        province: 'Kanchanaburi', region: 'West', capacity: 15,
        description: 'Riverside campsite close to the Erawan waterfalls with shaded pitches and river swimming.',
        facilities: ['Toilets', 'Showers', 'Parking', 'Kayak rental'],
        rules: ['No glass bottles near the river', 'Quiet hours 22:00-06:00', 'Take your rubbish with you']
    },
    {
        name: 'Doi Chang Coffee Camp', address: 'Wawee, Mae Suai, Chiang Rai 57180', tel: '0530000004',
        province: 'Chiang Rai', region: 'North', capacity: 8,
        description: 'Small hillside camp among coffee plantations with sunrise views over the valley.',
        facilities: ['Toilets', 'Coffee bar', 'Parking', 'Wi-Fi'],
        rules: ['Quiet hours 21:00-06:00', 'No open fires', 'Respect the plantation']
    },
    {
        name: 'Phu Ruea Cloud Camp', address: 'Phu Ruea, Loei 42160', tel: '0420000005',
        province: 'Loei', region: 'Northeast', capacity: 10,
        description: 'High-altitude campsite above the sea of mist, with cold nights and clear stars.',
        facilities: ['Toilets', 'Parking', 'Fire pit', 'Tent rental'],
        rules: ['Bring warm clothes', 'Quiet hours 22:00-06:00', 'Stay on marked trails']
    },
    {
        name: 'Nang Rong Waterfall Camp', address: 'Pak Phli, Nakhon Nayok 26130', tel: '0370000006',
        province: 'Nakhon Nayok', region: 'Central', capacity: 18,
        description: 'Family-friendly camp near a waterfall, one hour from Bangkok.',
        facilities: ['Toilets', 'Showers', 'Parking', 'Playground', 'Shop'],
        rules: ['Children must be supervised near water', 'Quiet hours 22:00-06:00', 'No speakers']
    },
    {
        name: 'Khao Chamao Forest Camp', address: 'Wang Chan, Rayong 21210', tel: '0380000007',
        province: 'Rayong', region: 'East', capacity: 14,
        description: 'Forest campground near the Khao Chamao waterfalls, shaded all day.',
        facilities: ['Toilets', 'Showers', 'Parking', 'Barbecue area'],
        rules: ['No fishing', 'Quiet hours 22:00-06:00', 'Keep fires in the barbecue area']
    },
    {
        name: 'Sai Yok Bamboo Camp', address: 'Sai Yok, Kanchanaburi 71150', tel: '0340000008',
        province: 'Kanchanaburi', region: 'West', capacity: 6,
        description: 'Quiet bamboo-raft camp beside the river with simple pitches.',
        facilities: ['Toilets', 'Parking', 'Raft rides'],
        rules: ['Life jackets required on rafts', 'Quiet hours 21:00-06:00', 'No littering']
    },
    {
        name: 'Railay Beach Camp', address: 'Ao Nang, Mueang Krabi, Krabi 81000', tel: '0750000009',
        province: 'Krabi', region: 'South', capacity: 5,
        description: 'Beachside campsite surrounded by limestone cliffs, reachable by longtail boat.',
        facilities: ['Toilets', 'Cold showers', 'Boat transfer'],
        rules: ['No glass on the beach', 'Quiet hours 22:00-06:00', 'Do not disturb marine life']
    },
    //The "full" case: capacity 1 and booked on the day FULL_DAY_OFFSET days from today
    {
        name: 'Mae Sa Hideaway', address: 'Mae Rim, Chiang Mai 50180', tel: '0530000010',
        province: 'Chiang Mai', region: 'North', capacity: 1,
        description: 'A single private pitch by the stream. Very popular, so it is often fully booked.',
        facilities: ['Private toilet', 'Parking', 'Fire pit'],
        rules: ['One tent only', 'Quiet hours 21:00-06:00', 'No visitors']
    }
];

const FULL_DAY_OFFSET = 7;

const importData = async () => {
    await destroyData(false);

    //create() (not insertMany) so the password hash hook runs
    const [, user1, user2] = await User.create(users);
    const created = await Campground.create(campgrounds);
    const [inthanon, khaoYai, erawan] = created;
    const full = created[created.length - 1];
    const fullDate = daysFromToday(FULL_DAY_OFFSET);

    const bookings = await Booking.create([
        //Past stays (completed) so reviews can be tested; these two get reviews below
        { user: user1._id, campground: inthanon._id, checkInDate: daysFromToday(-10), nights: 2, status: 'completed' },
        { user: user2._id, campground: khaoYai._id, checkInDate: daysFromToday(-7), nights: 3, status: 'completed' },
        //Completed and left unreviewed, for testing "create review"
        { user: user1._id, campground: erawan._id, checkInDate: daysFromToday(-20), nights: 1, status: 'completed' },
        //Upcoming stays
        { user: user1._id, campground: khaoYai._id, checkInDate: daysFromToday(7), nights: 1 },
        { user: user1._id, campground: erawan._id, checkInDate: daysFromToday(14), nights: 3 },
        { user: user2._id, campground: inthanon._id, checkInDate: daysFromToday(10), nights: 2 },
        //Fills the capacity-1 campground on fullDate
        { user: user2._id, campground: full._id, checkInDate: fullDate, nights: 1 },
        //Cancelled
        { user: user2._id, campground: erawan._id, checkInDate: daysFromToday(5), nights: 1, status: 'cancelled' }
    ]);

    //create() (not insertMany) so each campground's averageRating/ratingCount is recalculated
    await Review.create([
        { user: user1._id, campground: inthanon._id, booking: bookings[0]._id, rating: 5, comment: 'Cool air, great views and very clean toilets.' },
        { user: user2._id, campground: khaoYai._id, booking: bookings[1]._id, rating: 4, comment: 'Lovely pine forest, we saw hornbills in the morning.' }
    ]);

    console.log('Data imported');
    console.log('  admin@gmail.com / 123456 (admin)');
    console.log('  user1@gmail.com / 123456');
    console.log('  user2@gmail.com / 123456');
    console.log(`  ${created.length} campgrounds, ${bookings.length} bookings, 2 reviews`);
    console.log(`  Full campground: ${full.name} is full on ${fullDate.toISOString().slice(0, 10)}`);
};

const destroyData = async (log = true) => {
    await Review.deleteMany();
    await Booking.deleteMany();
    await Campground.deleteMany();
    await User.deleteMany();
    await RevokedToken.deleteMany();
    if (log) console.log('Data destroyed');
};

const run = async () => {
    const flag = process.argv[2];
    if (flag !== '-i' && flag !== '-d') {
        console.log('Usage: node seeder -i (import) | node seeder -d (destroy) [--force to allow a non-local database]');
        process.exit(1);
    }

    if (!isLocalMongoUri(process.env.MONGO_URI) && !process.argv.includes('--force')) {
        console.log(`Refusing to seed a non-local database (${describeMongoHosts(process.env.MONGO_URI)}). Re-run with --force if you really mean it, e.g. node seeder -i --force`);
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        //Make sure unique indexes exist before inserting
        await Promise.all([User.init(), Campground.init(), Booking.init(), Review.init()]);

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
