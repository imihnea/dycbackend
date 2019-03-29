const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');

const ChatSchema = new Schema({
    user1: { id: Schema.Types.ObjectId, fullname: String, username: String, avatarUrl: String },
    user2: { id: Schema.Types.ObjectId, fullname: String, username: String, avatarUrl: String },
    product: { id: Schema.Types.ObjectId, name: String, imageUrl: String, price: [Number], accepted: [Boolean] },
    messages: [{ sender: Schema.Types.ObjectId, message: String, 
        createdAt: { type: Date, default: Date.now },
        read: { type: Boolean, default: false } }],
    messageCount: { type: Number, default: 0 },
    deal: Schema.Types.ObjectId,
    createdAt: { type: Date, default: Date.now }
});

ChatSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Chat', ChatSchema);