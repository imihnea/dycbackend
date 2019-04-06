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
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', LogSchema);
