const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const SubscriptionSchema = new Schema({
  userid: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  username: { type: String },
  createdAt: { type: Date, default: Date.now },
  expires: { type: Date, expires: 2592000 }
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);
