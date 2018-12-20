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
  price: Number,
  accepted: Array,
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  buyer: String,
  bought_with: String,
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

ProductSchema.methods.calculateAvgRating = () => {
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
