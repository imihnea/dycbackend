const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const Schema = mongoose.Schema;

const reportSchema = new Schema({
    createdAt: {type: Date, default: Date.now},
    message: String,
    reason: String,
    from: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    review: {
        type: Schema.Types.ObjectId,
        ref: 'Review'
    },
    reviewMessage: String,
    deal: {
        type: Schema.Types.ObjectId,
        ref: 'Deal'
    }    
});

reportSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Report', reportSchema);
