const mongoose = require('mongoose');
const mongoosastic = require('mongoosastic');

const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');
const Review = require('./review');


const ProductSchema = new Schema({
  name: { type: String, es_indexed: true, es_type: 'text' },
  images: [{ url: {type: String, es_indexed: true, es_type: 'text' }, public_id: String }],
  category: { type: Array, es_indexed: true, es_type: 'text' },
  condition: { type: String, es_indexed: true, es_type: 'text' },
  description: { type: String, es_indexed: true, es_type: 'text' },
  status: { type: String, es_indexed: true, es_type: 'text' },
  btcPrice: {type: Number, default: 0, es_indexed: true, es_type: 'double' },
  available: { type: String, default: "True", es_indexed: true, es_type: 'text' },
  repeatable: { type: Boolean, default: false },
  tags: [ String ],
  searchableTags: { type: String, es_indexed: true, es_type: 'text'},
  createdAt: { type: Date, default: Date.now, es_indexed: true, es_type: 'date' },
  views: { type: Number, default: 0, es_indexed: true, es_type: 'long'},
  viewDates: [ Date ],
  nrBought: {type: Number, default: 0 },
  feat_1: {
    status: { type: Boolean, default: false, es_indexed: true, es_type: 'boolean' },
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
      es_type: 'text', 
      es_indexed: true
    },
    username: { type: String, es_type: 'text', es_indexed: true},
    name: { type: String, es_type: 'text', es_indexed: true },
    city: { type: String, es_type: 'text', es_indexed: true },
    country: { type: String, es_type: 'text', es_indexed: true },
    state: { type: String, es_type: 'text', es_indexed: true },
    continent: { type: String, es_type: 'text', es_indexed: true },
    accountType: { type: String, es_type: 'text', es_indexed: true },
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      es_type: 'text'
    },
  ],
  avgRating: { type: Number, default: 0, es_indexed: true, es_type: 'double' },
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
  lastBought: { type: Date, default: Date.now }
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

// For local ElasticSearch
// ProductSchema.plugin(mongoosastic);

// For hosted ElasticSearch
// ProductSchema.plugin(mongoosastic,{  
  // host: 'elasticsearch',
  // port: 9200
// });


// mongoose.model('Product', ProductSchema).createMapping( (err, mapping) => {  
//   if (err) {
//     console.log('error creating mapping');
//     console.log(err);
//   } else {
//     console.log('mapping created');
//     console.log(mapping);
//   }
// });

// // Delete the index on server restart
// mongoose.model('Product', ProductSchema).esTruncate((err) => {
//   if (err) {
//     console.log('cannot delete index.');
//     console.log(err);
//   } else {
//     console.log('index deleted successfully.');
//   }
// });

// // Synchronize the index on server restart
// let stream = mongoose.model('Product', ProductSchema).synchronize();
// let count = 0;
// stream.on('data', function(err, doc){
//   count += 1;
// });
// stream.on('close', function(){
//   console.log('indexed ' + count + ' documents!');
// });
// stream.on('error', function(err){
//   console.log(err);
// });

module.exports = mongoose.model('Product', ProductSchema);
