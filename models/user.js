const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

function toLower(str) {
  return str.toLowerCase();
}

const UserSchema = new mongoose.Schema({
  email: { type: String, set: toLower },
  username: { type: String, set: toLower },
  password: String,
  btcadr: { type: String, default: '' },
  bchadr: { type: String, default: '' },
  ethadr: { type: String, default: '' },
  ltcadr: { type: String, default: '' },
  dashadr: { type: String, default: '' },
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
