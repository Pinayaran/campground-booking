const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
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
  //One review per booking
  booking: {
    type: mongoose.Schema.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating between 1 and 5'],
    min: [1, 'Please add a rating between 1 and 5'],
    max: [5, 'Please add a rating between 1 and 5'],
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be a whole number'
    }
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment can not be more than 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

//Recompute the campground's averageRating (1 decimal) and ratingCount from its reviews
ReviewSchema.statics.calcAverageRating = async function (campgroundId) {
  const [stats] = await this.aggregate([
    { $match: { campground: new mongoose.Types.ObjectId(String(campgroundId)) } },
    { $group: { _id: '$campground', average: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  await this.model('Campground').findByIdAndUpdate(campgroundId, {
    averageRating: stats ? Math.round(stats.average * 10) / 10 : 0,
    ratingCount: stats ? stats.count : 0
  });
};

//Controllers must use review.save() / review.deleteOne() so these hooks run
ReviewSchema.post('save', async function () {
  await this.constructor.calcAverageRating(this.campground);
});

ReviewSchema.post('deleteOne', { document: true, query: false }, async function () {
  await this.constructor.calcAverageRating(this.campground);
});

module.exports = mongoose.model('Review', ReviewSchema);
