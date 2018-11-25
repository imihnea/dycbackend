const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: String,
  image: String,
  imageId: String,
  category: String,
  description: String,
  status: String,
  price: Number,
  accepted: Array,
  //featured: Boolean,
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  buyer: String,
  bought_with: String,
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    username: String,
  },
  feat_1: Boolean,
  feat_2: Boolean,
  feat_3: Boolean,
});

module.exports = mongoose.model('Product', ProductSchema);
