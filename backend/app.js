const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

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

module.exports = app;
