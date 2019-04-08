const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const SubscriptionSchema = new Schema({
  userid: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  username: { type: String },
  createdAt: { type: Date, default: Date.now },
  expireDate: { type: Date },
  expires1: { type: Date, index: { expires: '30d' } },
  expires3: { type: Date, index: { expires: '90d' } },
  expires6: { type: Date, index: { expires: '180d' } },
  expires12: { type: Date, index: { expires: '360d' } },
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);
