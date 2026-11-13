const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
    getCampgrounds,
    getCampground,
    createCampground,
    updateCampground,
    deleteCampground,
    getCampgroundAvailability
} = require('../controllers/campgrounds');

//Include other resource routers
const bookingRouter = require('./bookings');

//Re-route into other resource routers
router.use('/:campgroundId/bookings', bookingRouter);

router.route('/')
    .get(getCampgrounds)
    .post(protect, authorize('admin'), createCampground);

router.get('/:id/availability', getCampgroundAvailability);

router.route('/:id')
    .get(getCampground)
    .put(protect, authorize('admin'), updateCampground)
    .delete(protect, authorize('admin'), deleteCampground);

module.exports = router;
