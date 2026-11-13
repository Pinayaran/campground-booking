const Campground = require('../models/Campground');
const Booking = require('../models/Booking');
const { buildFilter } = require('../utils/queryFilter');
const { checkAvailability } = require('../utils/availability');
const { parseDateOnly } = require('../utils/dates');

// @desc    Get all campgrounds
// @route   GET /api/v1/campgrounds
// @access  Public
// Plain list with field filters, select, sort and pagination.
// Lala extends this with province/region/search/date filters (L3).
exports.getCampgrounds = async (req, res, next) => {
    try {
        let query;

        //Copy req.query
        const reqQuery = { ...req.query };

        //Fields to exclude
        const removeFields = ['select', 'sort', 'page', 'limit'];

        //Loop over remove fields and delete them from reqQuery
        removeFields.forEach(param => delete reqQuery[param]);

        //Build the filter: only gt/gte/lt/lte/in operators, no raw $ keys (blocks NoSQL injection)
        const filter = buildFilter(reqQuery);

        //finding resource
        query = Campground.find(filter);

        //Select Fields
        if (req.query.select) {
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields);
        }

        //Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        //Pagination
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Campground.countDocuments(filter);

        query = query.skip(startIndex).limit(limit);

        //Executing query
        const campgrounds = await query;

        //Pagination result
        const pagination = {};

        if (endIndex < total) {
            pagination.next = { page: page + 1, limit };
        }

        if (startIndex > 0) {
            pagination.prev = { page: page - 1, limit };
        }

        res.status(200).json({
            success: true,
            count: campgrounds.length,
            pagination,
            data: campgrounds
        });
    } catch (err) {
        console.log(err.stack);
        res.status(400).json({ success: false, message: 'Invalid query' });
    }
};

// @desc    Get single campground
// @route   GET /api/v1/campgrounds/:id
// @access  Public
exports.getCampground = async (req, res, next) => {
    try {
        const campground = await Campground.findById(req.params.id);

        if (!campground) {
            return res.status(404).json({ success: false, message: `No campground with the id of ${req.params.id}` });
        }

        res.status(200).json({
            success: true,
            data: campground
        });
    } catch (err) {
        console.log(err.stack);
        res.status(400).json({ success: false, message: 'Invalid campground id' });
    }
};

// @desc    Create new campground
// @route   POST /api/v1/campgrounds
// @access  Private (admin)
exports.createCampground = async (req, res, next) => {
    try {
        //Only reviews may set ratings
        const { averageRating, ratingCount, ...fields } = req.body;
        const campground = await Campground.create(fields);

        res.status(201).json({
            success: true,
            data: campground
        });
    } catch (err) {
        console.log(err.stack);
        res.status(400).json({ success: false, message: err.code === 11000 ? 'Campground name already exists' : err.message });
    }
};

// @desc    Update campground
// @route   PUT /api/v1/campgrounds/:id
// @access  Private (admin)
exports.updateCampground = async (req, res, next) => {
    try {
        //Only reviews may set ratings
        const { averageRating, ratingCount, ...fields } = req.body;
        const campground = await Campground.findByIdAndUpdate(req.params.id, fields, {
            runValidators: true,
            returnDocument: 'after'
        });

        if (!campground) {
            return res.status(404).json({ success: false, message: `No campground with the id of ${req.params.id}` });
        }

        res.status(200).json({
            success: true,
            data: campground
        });
    } catch (err) {
        console.log(err.stack);
        res.status(400).json({ success: false, message: err.code === 11000 ? 'Campground name already exists' : err.message });
    }
};

// @desc    Delete campground (and its bookings)
// @route   DELETE /api/v1/campgrounds/:id
// @access  Private (admin)
exports.deleteCampground = async (req, res, next) => {
    try {
        const campground = await Campground.findById(req.params.id);

        if (!campground) {
            return res.status(404).json({ success: false, message: `No campground with the id of ${req.params.id}` });
        }

        await Booking.deleteMany({ campground: req.params.id });
        await Campground.deleteOne({ _id: req.params.id });

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.log(err.stack);
        res.status(400).json({ success: false, message: 'Cannot delete campground' });
    }
};

// @desc    Get availability of a campground on one night
// @route   GET /api/v1/campgrounds/:id/availability?date=YYYY-MM-DD
// @access  Public
exports.getCampgroundAvailability = async (req, res, next) => {
    try {
        const date = parseDateOnly(req.query.date);
        if (!date) {
            return res.status(400).json({ success: false, message: 'Please provide a valid date (YYYY-MM-DD)' });
        }

        const campground = await Campground.findById(req.params.id).select('_id');
        if (!campground) {
            return res.status(404).json({ success: false, message: `No campground with the id of ${req.params.id}` });
        }

        const { capacity, booked, remaining, available } = await checkAvailability(campground._id, date, 1);

        res.status(200).json({
            success: true,
            data: { date: req.query.date, capacity, booked, remaining, available }
        });
    } catch (err) {
        console.log(err.stack);
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid campground id' });
        }
        res.status(500).json({ success: false, message: 'Cannot check availability' });
    }
};
