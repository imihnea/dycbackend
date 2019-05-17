const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const withdrawSchema = new Schema({
    address: String,
    amount: Number,
    withdrawDate: Date,
    userID: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {type: String, default: 'Processing'}
});

module.exports = mongoose.model('Withdraw', withdrawSchema);
