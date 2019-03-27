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
  accepted: { type: Array, default: [0, 0, 0, 0, 0] },
  available: { type: String, default: "True", es_indexed: true, es_type: 'text' },
  repeatable: { type: Boolean, default: false },
  deliveryOptions: { city: {valid: {type: Boolean, default: false, es_indexed: true }, cost: String, percent: { type: Number, default: 0 }}, 
                     state: {valid: {type: Boolean, default: false, es_indexed: true }, cost: String, percent: { type: Number, default: 0 }},
                     country: {valid: {type: Boolean, default: false, es_indexed: true }, cost: String, percent: { type: Number, default: 0 }}, 
                     worldwide: {valid: {type: Boolean, default: false, es_indexed: true }, cost: String, percent: { type: Number, default: 0 }} 
                    },
  createdAt: { type: Date, default: Date.now, es_indexed: true, es_type: 'date' },
  nrBought: Number,
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
      es_type: 'text'
    },
    username: { type: String, es_type: 'text'},
    city: { type: String, es_type: 'text'},
    country: { type: String, es_type: 'text'},
    state: { type: String, es_type: 'text'},
    continent: { type: String, es_type: 'text'}
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      es_type: 'text'
    },
  ],
  avgRating: { type: Number, default: 0, es_indexed: true },
  tags: { type: Array, es_indexed: true, es_type: 'keyword' }
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
  // host: 'elasticsearch',
  // port: 9200
// });


mongoose.model('Product', ProductSchema).createMapping( (err, mapping) => {  
  if (err) {
    console.log('error creating mapping');
    console.log(err);
  } else {
    console.log('mapping created');
    console.log(mapping);
  }
});

// Delete the index on server restart
mongoose.model('Product', ProductSchema).esTruncate((err) => {
  if (err) {
    console.log('cannot delete index.');
    console.log(err);
  } else {
    console.log('index deleted successfully.');
  }
});

// Synchronize the index on server restart
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
