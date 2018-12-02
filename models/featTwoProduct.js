const mongoose = require('mongoose');

const featTwoSchema = new mongoose.Schema({
  name: String,
  image: String,
  imageId: String,
  category: String,
  description: String,
  status: String,
  price: Number,
  accepted: Array,
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now(), expires: 30 },
  buyer: String,
  bought_with: String,
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    username: String,
  },
});

module.exports = mongoose.model('FeatTwoProduct', featTwoSchema);
