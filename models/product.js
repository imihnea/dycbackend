const mongoose = require('mongoose');
const mongooseAlgolia = require('mongoose-algolia');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');
const Review = require('./review');


const ProductSchema = new Schema({
  name: String,
  images: [{ url: String, public_id: String }],
  category: String,
  description: String,
  status: String,
  price: { type: Array, default: [0, 0, 0, 0, 0] },
  accepted: { type: Array, default: [0, 0, 0, 0, 0] },
  available: { type: String, default: "True" },
  repeatable: { type: Boolean, default: false },
  deliveryOptions: { city: {valid: {type: Boolean, default: false}, cost: String, percent: { type: Number, default: 0 }}, 
                     state: {valid: {type: Boolean, default: false}, cost: String, percent: { type: Number, default: 0 }},
                     country: {valid: {type: Boolean, default: false}, cost: String, percent: { type: Number, default: 0 }}, 
                     worldwide: {valid: {type: Boolean, default: false}, cost: String, percent: { type: Number, default: 0 }} 
                    },
  createdAt: { type: Date, default: Date.now },
  nrBought: Number,
  feat_1: {
    status: { type: Boolean, default: false},
    expiry_date: Date
  },
  feat_2: {
    status: { type: Boolean, default: false},
    expiry_date: Date
  },
  author: {
    id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    username: String,
    city: String,
    country: String,
    state: String
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Review',
    },
  ],
  avgRating: { type: Number, default: 0 },
});

ProductSchema.pre('remove', async () => {
  await Review.remove({
    _id: {
      $in: this.reviews,
    },
  });
});

ProductSchema.methods.calculateAvgRating = function() {
  let ratingsTotal = 0;
  if (this.reviews.length) {
    this.reviews.forEach((review) => {
      ratingsTotal += review.rating;
    });
    this.avgRating = Math.round((ratingsTotal / this.reviews.length) * 10) / 10;
  } else {
    this.avgRating = ratingsTotal;
  }
  const floorRating = Math.floor(this.avgRating);
  this.save();
  return floorRating;
};

ProductSchema.plugin(mongoosePaginate);

ProductSchema.plugin(mongooseAlgolia,{
  appId: process.env.ALGOLIA_APP_ID,
  apiKey: process.env.ALGOLIA_API_KEY,
  indexName: 'instant_search', //The name of the index in Algolia, you can also pass in a function
  selector: '-_id -status -available -repeatable -createdAt -nrBought -feat_1 -feat_2 -reviews', //You can decide which field that are getting synced to Algolia (same as selector in mongoose)
  defaults: {
    author: 'unknown',
  },
  debug: true// Default: false -> If true operations are logged out in your console
});

mongoose.model('Product', ProductSchema).SyncToAlgolia(); //Clears the Algolia index for this schema and synchronizes all documents to Algolia (based on the settings defined in your plugin settings)
mongoose.model('Product', ProductSchema).SetAlgoliaSettings({
  searchableAttributes: ['name','category','description', 'author'] //Sets the settings for this schema, see [Algolia's Index settings parameters](https://www.algolia.com/doc/api-client/javascript/settings#set-settings) for more info.
});


module.exports = mongoose.model('Product', ProductSchema);
