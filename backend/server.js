const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const connectDB = require('./config/db');

//load env var
dotenv.config({ path: './config/config.env' });

const campgrounds = require('./routes/campgrounds');
const bookings = require('./routes/bookings');
const auth = require('./routes/auth');

const app = express();
app.set('query parser', 'extended');
app.use(express.json());
app.use(helmet());
//Rate limiting: 1000 requests per 10 minutes per IP (high enough for Postman runs)
app.use(rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 1000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later' }
}));
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

app.use('/api/v1/campgrounds', campgrounds);
app.use('/api/v1/bookings', bookings);
app.use('/api/v1/auth', auth);

//Unknown route
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

//Basic error handler
app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Server error'
    });
});

const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
    try {
        await connectDB();
        server = app.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        });
    } catch (err) {
        console.log(`Error: ${err.message}`);
        process.exit(1);
    }
};

startServer();

process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    if (server) {
        server.close(() => process.exit(1));
    } else {
        process.exit(1);
    }
});
