const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

function toLower(str) {
  return str.toLowerCase();
}

const UserSchema = new mongoose.Schema({
  email: { type: String, set: toLower },
  username: { type: String, set: toLower },
  password: String,
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
