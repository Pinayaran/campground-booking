const mongoose = require('mongoose');

//Base fields (D4). Lala adds location/province/region, description, facilities,
//rules, capacity, averageRating, ratingCount, images and the reviews virtual (L1).
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
    required: [true, 'Please add a telephone number']
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

module.exports = mongoose.model('Campground', CampgroundSchema);
