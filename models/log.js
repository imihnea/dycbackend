const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const LogSchema = new Schema({
    logType: String,
    message: String,
    data: { 
        oldData: [ String ], 
        newData: [ String ] 
    },
    sentFromUser: {     
        type: Schema.Types.ObjectId,
        ref: 'User' 
    },
    sentFromFile: String,
    sentFromMethod: String,
    deal: {     
        type: Schema.Types.ObjectId,
        ref: 'Deal' 
    },
    chat: {
        type: Schema.Types.ObjectId,
        ref: 'Chat'
    },
    product:  {     
        type: Schema.Types.ObjectId,
        ref: 'Product' 
    },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: Date.now() + 90 * 60 * 1000 } // 90 min; logs get sent every 60 mins
});

module.exports = mongoose.model('Log', LogSchema);
