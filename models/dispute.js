const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');

const DisputeSchema = new Schema({
    status: { type: String, default: 'Processing' },
    deal: Schema.Types.ObjectId,
    chat: Schema.Types.ObjectId,
    product: { 
        id: Schema.Types.ObjectId, 
        name: String, 
        imageUrl: String,
        price: Number
    },
    buyer: { 
        id: Schema.Types.ObjectId, 
        name: String
    },
    seller: {
        id: { 
            type: Schema.Types.ObjectId, 
            ref: 'User' 
        }, 
        username: String,
        name: String
    },
    refund: { 
        reason: String, 
        message: String, 
        images: [{
            imageurl: String,
            imageid: String
        }],
        timeOfRequest: Date, 
        sellerReason: String, 
        sellerMessage: String, 
    },
    price: Number,
    shippingPrice: Number,
    rate: String,
});

DisputeSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Dispute', DisputeSchema);