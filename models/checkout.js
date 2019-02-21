const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CheckoutSchema = new Schema({
    user: { type: String },
    orderId: { type: String },
    invoice: { type: String, unique: true },
    address: { type: String },
    confirmations: { type: Number },
    maxConfirmations: { type: Number },
    orderTotal: { type: Number },
    paid: { type: Boolean },
});

module.exports = mongoose.model('Checkout', CheckoutSchema);