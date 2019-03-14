const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const searchTermSchema = new Schema({
    query: String,
    queryFilters: {
        category: String,
        secondCategory: String,
        thirdCategory: String,
        condition: String,
        avgRating: String,
        continent: String
    },
    author: {
        id: {
          type: Schema.Types.ObjectId,
          ref: 'User'
        },
        username: String,
        city: String,
        country: String,
        state: String,
        continent: String
      },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('searchTerm', searchTermSchema);