const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');
const passportLocalMongoose = require('passport-local-mongoose');

const Schema = mongoose.Schema;

function toLower(str) {
  return str.toLowerCase();
}

const DeletedSchema = new Schema({
  name: String,
  email: {
    type: String,
    set: toLower,
  },
  username: { 
    type: String, 
    set: toLower 
  },
  avatar: { 
    url: { 
      type: String, 
      default: '/dist/img/avatar.png'
    }, 
    public_id: String 
  },
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
  country: String,
  state: String,
  city: String,
  continent: String,
  address1: String,
  address2: String,
  zip: String,
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
  ban: [{
    banDay: {type: Date, default: Date.now},
    until: Date,
    reason: String
  }]
});

DeletedSchema.plugin(findOrCreate);
DeletedSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('Deleted', DeletedSchema);
