const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');
const Review = require('./review');

const ProductSchema = new Schema({
  name: { type: String, es_indexed: true },
  images: {
    main: [{
      url: {type: String, es_indexed: true},
      public_id: String
    }],
    sec: [{
      url: {type: String, es_indexed: true},
      public_id: String
    }]
  },
  category: { type: Array, es_indexed: true },
  condition: { type: String, es_indexed: true },
  description: { type: String, es_indexed: true },
  status: { type: String, es_indexed: true },
  btcPrice: {type: Number, default: 0, es_indexed: true },
  usdPrice: Number,
  dropshipped: Boolean,
  link: String,
  available: { type: String, default: "True", es_indexed: true },
  repeatable: { type: Boolean, default: false },
  tags: [ String ],
  searchableTags: { type: String, es_indexed: true},
  createdAt: { type: Date, default: Date.now, es_indexed: true },
  views: { type: Number, default: 0, es_indexed: true},
  viewDates: [ Date ],
  nrBought: {type: Number, default: 0 },
  feat_1: {
    status: { type: Boolean, default: false, es_indexed: true },
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
      
      es_indexed: true
    },
    username: { type: String,  es_indexed: true},
    name: { type: String, es_indexed: true },
    city: { type: String,  es_indexed: true },
    country: { type: String,  es_indexed: true },
    state: { type: String,  es_indexed: true },
    continent: { type: String,  es_indexed: true },
    accountType: { type: String, es_indexed: true },
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Review',
 
    },
  ],
  avgRating: { type: Number, default: 0, es_indexed: true },
  delivery: {
    shipping: Boolean,
    name: String,
    street1: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    phone: String,
    email: String, 
    es_indexed: false
  },
  carrier: {
    dhl_express: Boolean,
    usps: Boolean,
    sendle: Boolean,
    parcelforce: Boolean,
    deutsche_post: Boolean,
    couriersplease: Boolean,
    fastway: Boolean,
    es_indexed: false
  },
  parcel: {
    parcel_length: Number,
    parcel_width: Number,
    parcel_height: Number,
    parcel_distance_unit: String,
    parcel_weight: Number,
    parcel_weight_unit: String,
    es_indexed: false
  },
  deleteIn30: {
    status: { type: Boolean, default: false },
    deleteDate: Date,
    es_indexed: false
  },
  lastBought: { type: Date, default: Date.now },
  reports: [{
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    report: {
      type: Schema.Types.ObjectId,
      ref: 'Report'
    }
  }]
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

module.exports = mongoose.model('Product', ProductSchema);
