const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const supplierSchema = new Schema({
    name: String,
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    products: Number
});

module.exports = mongoose.model('Supplier', supplierSchema);
