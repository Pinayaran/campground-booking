const mongoose = require('mongoose');

const DAY_MS = 24 * 60 * 60 * 1000;

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  campground: {
    type: mongoose.Schema.ObjectId,
    ref: 'Campground',
    required: true
  },
  checkInDate: {
    type: Date,
    required: [true, 'Please add a check-in date']
  },
  nights: {
    type: Number,
    required: [true, 'Please add the number of nights'],
    min: [1, 'A booking must be at least 1 night'],
    max: [3, 'A booking can not be more than 3 nights'],
    validate: {
      validator: Number.isInteger,
      message: 'Nights must be a whole number'
    }
  },
  //Computed from checkInDate + nights, stored so it can be queried
  checkOutDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

BookingSchema.pre('validate', function () {
  if (this.checkInDate && this.nights) {
    this.checkOutDate = new Date(this.checkInDate.getTime() + this.nights * DAY_MS);
  }
});

//Mark bookings whose check-out date has passed as completed
BookingSchema.statics.markCompleted = function (filter = {}) {
  return this.updateMany(
    { ...filter, status: 'upcoming', checkOutDate: { $lte: new Date() } },
    { status: 'completed' }
  );
};

module.exports = mongoose.model('Booking', BookingSchema);
