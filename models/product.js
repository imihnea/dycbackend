const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');
const Review = require('./review');


const ProductSchema = new Schema({
  name: String,
  images: [{ url: String, public_id: String }],
  category: String,
  description: String,
  status: String,
  price: { type: Array, default: [0, 0, 0, 0, 0] },
  accepted: { type: Array, default: [0, 0, 0, 0, 0] },
  available: { type: String, default: "True" },
  repeatable: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  nrBought: Number,
  feat_1: {
    status: { type: Boolean, default: false},
    expiry_date: Date
  },
  feat_2: {
    status: { type: Boolean, default: false},
    expiry_date: Date
  },
  author: {
    id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    username: String,
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Review',
    },
  ],
  avgRating: { type: Number, default: 0 },
});

ProductSchema.pre('remove', async () => {
  await Review.remove({
    _id: {
      $in: this.reviews,
    },
  });
});

ProductSchema.methods.calculateAvgRating = function() {
  let ratingsTotal = 0;
  if (this.reviews.length) {
    this.reviews.forEach((review) => {
      ratingsTotal += review.rating;
    });
    this.avgRating = Math.round((ratingsTotal / this.reviews.length) * 10) / 10;
  } else {
    this.avgRating = ratingsTotal;
  }
  const floorRating = Math.floor(this.avgRating);
  this.save();
  return floorRating;
};

ProductSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Product', ProductSchema);
