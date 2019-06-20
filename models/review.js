const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  body: String,
  rating: Number,
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  name: String,
  avatarUrl: String,
  createdAt: { type: Date, default: Date.now },
  reports: [{
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt:{
      type: Date,
      default: Date.now
    }
  }]
});

ReviewSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Review', ReviewSchema);
