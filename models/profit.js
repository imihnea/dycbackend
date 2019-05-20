const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const profitSchema = new Schema({
    amount: Number,
    acquired: String,
    profitDate: { type: Date, default: Date.now },
    userID: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {type: String, default: 'Unpaid'}
});

module.exports = mongoose.model('Profit', profitSchema);
