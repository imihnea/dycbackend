const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');
const passportLocalMongoose = require('passport-local-mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;

function toLower(str) {
  return str.toLowerCase();
}

const UserSchema = new Schema({
  name: String,
  email: {
    type: String,
    set: toLower,
  },
  confirmed: { type: Boolean, default: false },
  username: { type: String, set: toLower },
  avatar: { url: {type: String, default: 'https://res.cloudinary.com/dxbujmytn/image/upload/v1548677272/gbjahfrfhjyh0clslkux.png' /* Modify with something else */}, public_id: String },
  password: String,
  btcbalance: Number,
  full_name: String,
  number: Number,
  twofactor: Boolean,
  country: String,
  state: String,
  city: String,
  continent: String,
  address1: String,
  address2: String,
  zip: String,
  accountType: { type: String, default: 'Standard' },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  resetEmailToken: String,
  resetEmailExpires: Date,
  facebookId: String,
  googleId: String,
  btcadr: String,
  feature_tokens: { type: Number, default: 0 },
  nrSold: { type: Number, default: 0 },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Review',
    },
  ],
  avgRating: { type: Number, default: 0 },
});

UserSchema.pre('remove', async () => {
  await Review.remove({
    _id: {
      $in: this.reviews,
    },
  });
});

UserSchema.methods.calculateAvgRating = function() {
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

UserSchema.plugin(findOrCreate);
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
