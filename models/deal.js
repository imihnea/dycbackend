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
        delivery: {
            shipping: String,
            carrier: String,
            tracking_number: String,
            transaction: String,
            name: String,
            street1: String,
            city: String,
            state: String,
            zip: String,
            country: String,
            phone: String,
            email: String,
        } 
    },
    proof: {
        text: {
            type: String,
            default: 'Unset'
        },
        image: {
            type: String,
            default: 'Unset'
        },
        imageid: String
    },
    price: Number,
    shippingPrice: Number,
    rate: String,
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
    paid: { type: Boolean, default: false },
    report: { 
        status: { 
            type: Boolean, 
            default: false 
        },
        report: {
            type: Schema.Types.ObjectId,
            ref: 'Report'
        }
    }
});

DealSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Deal', DealSchema);
