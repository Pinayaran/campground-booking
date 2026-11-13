const mongoose = require('mongoose');
const { telValidator } = require('../utils/tel');
const { REGIONS } = require('../config/regions');

//averageRating and ratingCount are maintained by reviews, not set through the API
const CampgroundSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    unique: true,
    trim: true,
    maxlength: [100, 'Name can not be more than 100 characters']
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  tel: {
    type: String,
    required: [true, 'Please add a telephone number'],
    trim: true,
    validate: telValidator
  },
  province: {
    type: String,
    required: [true, 'Please add a province'],
    trim: true
  },
  region: {
    type: String,
    required: [true, 'Please add a region'],
    enum: {
      values: REGIONS,
      message: `Region must be one of: ${REGIONS.join(', ')}`
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description can not be more than 1000 characters']
  },
  facilities: {
    type: [String],
    default: []
  },
  rules: {
    type: [String],
    default: []
  },
  capacity: {
    type: Number,
    min: [1, 'Capacity must be at least 1'],
    default: 10,
    validate: {
      validator: Number.isInteger,
      message: 'Capacity must be a whole number'
    }
  },
  averageRating: {
    type: Number,
    min: [0, 'Rating can not be less than 0'],
    max: [5, 'Rating can not be more than 5'],
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  images: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

//Reverse populate with virtuals
CampgroundSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'campground',
  justOne: false
});

CampgroundSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'campground',
  justOne: false
});

CampgroundSchema.index({ province: 1 });
CampgroundSchema.index({ region: 1 });

module.exports = mongoose.model('Campground', CampgroundSchema);
