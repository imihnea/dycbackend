const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    createdAt: {type: Date, default: Date.now},
    message: String,
    userid: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    linkTo: String,
    read: {type: Boolean, default: false}
});

module.exports = mongoose.model('Notification', notificationSchema);
