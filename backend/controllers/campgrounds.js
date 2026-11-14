const Campground = require('../models/Campground');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { buildFilter, invalidQueryError } = require('../utils/queryFilter');
const { buildCampgroundFilter } = require('../utils/campgroundQuery');
const { getPagination } = require('../utils/pagination');
const { checkAvailability, findFullCampgroundIds } = require('../utils/availability');
const { REGIONS } = require('../config/regions');
const { parseDateOnly } = require('../utils/dates');

//select and sort must be plain strings; arrays/objects from the extended query parser are a bad request
const requireString = value => {
    if (typeof value !== 'string') throw invalidQueryError();
    return value;
};

// @desc    Get all campgrounds
// @route   GET /api/v1/campgrounds
// @access  Public
// Lists campgrounds with field filters, province/region/search/date filters, select, sort and pagination.
exports.getCampgrounds = async (req, res, next) => {
    try {
        let query;

        //Copy req.query
        const reqQuery = { ...req.query };

        //Fields to exclude
        const removeFields = ['select', 'sort', 'page', 'limit', 'province', 'region', 'search', 'date'];

        //Loop over remove fields and delete them from reqQuery
        removeFields.forEach(param => delete reqQuery[param]);

        //Build the filter: only gt/gte/lt/lte/in operators, no raw $ keys (blocks NoSQL injection)
        const conditions = [buildFilter(reqQuery), buildCampgroundFilter(req.query)];

        //Hide campgrounds with no space left on the requested night
        if (req.query.date !== undefined) {
            const date = parseDateOnly(req.query.date);
            if (!date) {
                return res.status(400).json({ success: false, message: 'Please provide a valid date (YYYY-MM-DD)' });
            }
            conditions.push({ _id: { $nin: await findFullCampgroundIds(date) } });
        }

        const filter = { $and: conditions };

        //finding resource
        query = Campground.find(filter);

        //Select Fields
        if (req.query.select) {
            const fields = requireString(req.query.select).split(',').join(' ');
            query = query.select(fields);
        }

        //Sort
        if (req.query.sort) {
            const sortBy = requireString(req.query.sort).split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        //Pagination
        const total = await Campground.countDocuments(filter);
        const { skip, limit, pagination } = getPagination(req.query, total);

        query = query.skip(skip).limit(limit);

        //Executing query
        const campgrounds = await query;

        res.status(200).json({
            success: true,
            count: campgrounds.length,
            pagination,
            data: campgrounds
        });
    } catch (err) {
        console.log(err.stack);
        if (Number.isInteger(err.statusCode)) {
            return res.status(err.statusCode).json({ success: false, message: err.message });
        }
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid query' });
        }
        res.status(500).json({ success: false, message: 'Cannot get campgrounds' });
    }
};

// @desc    Get filter options: all regions and the provinces that have campgrounds
// @route   GET /api/v1/campgrounds/locations
// @access  Public
exports.getCampgroundLocations = async (req, res, next) => {
    try {
        const provinces = (await Campground.distinct('province')).sort((a, b) => a.localeCompare(b));

        res.status(200).json({
            success: true,
            data: { regions: REGIONS, provinces }
        });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({ success: false, message: 'Cannot get locations' });
    }
};

// @desc    Get single campground
// @route   GET /api/v1/campgrounds/:id
// @access  Public
exports.getCampground = async (req, res, next) => {
    try {
        //Latest 10 reviews, newest first, with the reviewer's name only
        const campground = await Campground.findById(req.params.id).populate({
            path: 'reviews',
            options: { sort: { createdAt: -1 }, limit: 10 },
            populate: { path: 'user', select: 'name' }
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
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid campground id' });
        }
        res.status(500).json({ success: false, message: 'Cannot get campground' });
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

// @desc    Delete campground (and its bookings and reviews)
// @route   DELETE /api/v1/campgrounds/:id
// @access  Private (admin)
exports.deleteCampground = async (req, res, next) => {
    try {
        const campground = await Campground.findById(req.params.id);

        if (!campground) {
            return res.status(404).json({ success: false, message: `No campground with the id of ${req.params.id}` });
        }

        await Booking.deleteMany({ campground: req.params.id });
        await Review.deleteMany({ campground: req.params.id });
        await Campground.deleteOne({ _id: req.params.id });

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.log(err.stack);
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid campground id' });
        }
        res.status(500).json({ success: false, message: 'Cannot delete campground' });
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
