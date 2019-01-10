const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');
const passportLocalMongoose = require('passport-local-mongoose');

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
  username: { type: String, set: toLower },
  avatar: { url: String, public_id: String },
  password: String,
  full_name: String,
  country: String,
  state: String,
  city: String,
  address1: String,
  address2: String,
  zip: Number,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  resetEmailToken: String,
  resetEmailExpires: Date,
  facebookId: String,
  googleId: String,
  btcadr: String,
  bchadr: String,
  ethadr: String,
  ltcadr: String,
  dashadr: String,
  feature_tokens: { type: Number, default: 0 },
});

UserSchema.plugin(findOrCreate);
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
