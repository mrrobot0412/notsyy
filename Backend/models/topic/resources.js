const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['video', 'pdf'],
        required: [true, 'Resource type is required']
    },
    source: [{
        type: String,
        required: [true, 'Source (URL or file path) is required']
    }],
    content: [{
        type: String
        // required: [true, 'Content is required']
    }],
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
        required: [true, 'Topic reference is required']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    }
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);