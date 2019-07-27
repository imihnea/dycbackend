const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');

const BlogSchema = new Schema({
    status:{
        type: String,
        default: 'Visible'
    },
    title: String,
    subtitle: String,
    images: [{
        url: String,
        public_id: String
    }],
    content: String,
    tags: [ String ],
    comments: [{
        user: {
            id: Schema.Types.ObjectId,
            username: String,
            avatarUrl: String
        },
        content: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        reports: [{
            from: {
              type: Schema.Types.ObjectId,
              ref: 'User'
            },
            report: {
              type: Schema.Types.ObjectId,
              ref: 'Report'
            }
        }]
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    views: { type: Number, default: 0},
    viewDates: [ Date ],
});

BlogSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Blogpost', BlogSchema);
