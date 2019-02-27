const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CheckoutSchema = new Schema({
    user: { type: String },
    orderId: { type: String },
    coin: { type: String },
    invoice: { type: String, unique: true },
    address: { type: String },
    confirmations: { type: Number },
    maxConfirmations: { type: Number },
    orderTotal: { type: Number },
    createdAt: { type: Date, default: Date.now },
    paid: { type: Boolean, default: false, index: true },
});

CheckoutSchema.index({createdAt: 1},{expireAfterSeconds: 60*60*24, partialFilterExpression : {paid: false}});
module.exports = mongoose.model('Checkout', CheckoutSchema);