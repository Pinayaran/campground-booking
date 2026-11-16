process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRE = '1h';
process.env.JWT_COOKIE_EXPIRE = '1';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

//Load every model so they are registered before indexes are built
require('../models/User');
require('../models/Campground');
require('../models/Booking');
require('../models/Review');

let mongod;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    //runtimeAdapters: Jest's vm sandbox can't run the driver's dynamic import('os'), which breaks the handshake
    await mongoose.connect(mongod.getUri(), { runtimeAdapters: { os: require('os') } });
    //Make sure unique indexes exist before tests run
    await Promise.all(Object.values(mongoose.models).map(m => m.init()));
}, 120000);

afterEach(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map(c => c.deleteMany({})));
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});
