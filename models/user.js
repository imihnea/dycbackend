const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');
const passportLocalMongoose = require('passport-local-mongoose');
const Review = require('./review');
const Subscription = require('./subscription');

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
  confirmed: { 
    type: Boolean, 
    default: false,
    index: true
  },
  username: { 
    type: String, 
    set: toLower 
  },
  avatar: { 
    url: { 
      type: String, 
      default: 'https://res.cloudinary.com/dxbujmytn/image/upload/v1548677272/gbjahfrfhjyh0clslkux.png' /* Modify with something else */
    }, 
    public_id: String 
  },
  password: String,
  btcbalance: { type: Number, default: 0 },
  withdrawal: [{ 
    createdAt: { 
      type: Date, 
      default: Date.now 
    }, 
    amount: Number, 
    currency: { 
      type: String, 
      default: 'BTC' 
    },
    sentTo: String
  }],
  full_name: String,
  number: String,
  twofactor: Boolean,
  country: String,
  state: String,
  city: String,
  continent: String,
  address1: String,
  address2: String,
  zip: String,
  unreadMessages: Number,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  resetEmailToken: String,
  resetEmailExpires: Date,
  facebookId: { 
    type: String,
    index: true
  },
  googleId: {
    type: String,
    index: true
  },
  btcadr: String,
  feature_tokens: { 
    type: Number, 
    default: 0 
  },
  nrSold: { 
    type: Number, 
    default: 0 
  },
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

// Fix this
// UserSchema.index({createdAt: 1}, {expireAfterSeconds: 10, partialFilterExpression: {confirmed: false, googleId: {$exists: false}, facebookId: {$exists: false} }});

module.exports = mongoose.model('User', UserSchema);
