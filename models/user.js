const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');
const passportLocalMongoose = require('passport-local-mongoose');

function toLower(str) {
  return str.toLowerCase();
}

const UserSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: {
    type: String,
    set: toLower,
    unique: true,
    default: '',
  },
  username: { type: String, set: toLower, default: '' },
  password: String,
  facebookId: { type: String, default: '' },
  btcadr: { type: String, default: '' },
  bchadr: { type: String, default: '' },
  ethadr: { type: String, default: '' },
  ltcadr: { type: String, default: '' },
  dashadr: { type: String, default: '' },
});

UserSchema.plugin(findOrCreate);
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
