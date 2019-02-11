const mongoose = require('mongoose');
const mongoosastic = require('mongoosastic');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');
const Review = require('./review');


const ProductSchema = new Schema({
  name: { type: String, es_indexed: true, es_type: 'text' },
  images: [{ url: {type: String, es_indexed: true, es_type: 'text' }, public_id: String }],
  category: { type: String, es_indexed: true, es_type: 'text' },
  description: { type: String, es_indexed: true, es_type: 'text' },
  status: { type: String, es_indexed: true, es_type: 'text' },
  price: { type: Array, default: [0, 0, 0, 0, 0] },
  btcPrice: {type: Number, default: 0, es_indexed: true, es_type: 'double' },
  bchPrice: {type: Number, default: 0, es_indexed: true, es_type: 'double' },
  ethPrice: {type: Number, default: 0, es_indexed: true, es_type: 'double' },
  ltcPrice: {type: Number, default: 0, es_indexed: true, es_type: 'double' },
  dashPrice: {type: Number, default: 0, es_indexed: true, es_type: 'double' },
  accepted: { type: Array, default: [0, 0, 0, 0, 0] },
  available: { type: String, default: "True", es_indexed: true, es_type: 'text' },
  repeatable: { type: Boolean, default: false },
  deliveryOptions: { city: {valid: {type: Boolean, default: false, es_indexed: true }, cost: String, percent: { type: Number, default: 0 }}, 
                     state: {valid: {type: Boolean, default: false, es_indexed: true }, cost: String, percent: { type: Number, default: 0 }},
                     country: {valid: {type: Boolean, default: false, es_indexed: true }, cost: String, percent: { type: Number, default: 0 }}, 
                     worldwide: {valid: {type: Boolean, default: false, es_indexed: true }, cost: String, percent: { type: Number, default: 0 }} 
                    },
  createdAt: { type: Date, default: Date.now, es_indexed: true  },
  nrBought: Number,
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
  avgRating: { type: Number, default: 0, es_indexed: true },
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
ProductSchema.plugin(mongoosastic);

// For hosted ElasticSearch
// ProductSchema.plugin(mongoosastic,{  
//   host:"",
//   port: ,
//   protocol: "https",
//   auth: "username:password",
//   curlDebug: true
// });

mongoose.model('Product', ProductSchema).createMapping( (err, mapping) => {  
  if (err) {
    console.log('error creating mapping (you can safely ignore this)');
    console.log(err);
  } else {
    console.log('mapping created!');
    console.log(mapping);
  }
});
let stream = mongoose.model('Product', ProductSchema).synchronize();
let count = 0;
stream.on('data', function(err, doc){
  count++;
});
stream.on('close', function(){
  console.log('indexed ' + count + ' documents!');
});
stream.on('error', function(err){
  console.log(err);
});

module.exports = mongoose.model('Product', ProductSchema);
