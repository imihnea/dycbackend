const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');

const DealSchema = new Schema({
    status: { type: String, default: 'Processing' },
    product: { 
        id: Schema.Types.ObjectId, 
        name: String, 
        imageUrl: String,
        author: { 
            id: { 
                type: Schema.Types.ObjectId, 
                ref: 'User' 
            }, 
            username: String,
            name: String
        },
        price: Number,
    },
    buyer: { 
        id: Schema.Types.ObjectId, 
        name: String, 
        username: String,
        avatarUrl: String, 
        address: { 
            country: String, 
            state: String, 
            city: String, 
            continent: String, 
            address1: String, 
            address2: String, 
            zip: Number 
        } 
    },
    price: Number,
    chat: Schema.Types.ObjectId,
    refund: { 
        reason: String, 
        message: String, 
        option: String, 
        status: { 
            type: String, 
            default: 'Not requested' 
        }, 
        timeOfRequest: Date, 
        sellerReason: String, 
        sellerMessage: String, 
        sellerOption: String 
    },
    createdAt: { type: Date, default: Date.now },
    completedAt: Date,
    refundableUntil: Date,
    paid: { type: Boolean, default: false }
});

DealSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Deal', DealSchema);
