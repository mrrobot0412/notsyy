const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant','developer'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    // relatedResourceIds: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Resource'
    // }]
});

const chatSchema = new mongoose.Schema({
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
        required: true
    },
    resourceId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource',
        required:true
    },
    parentChatId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        default: null
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    modeId:{
        type:String,
    },
    messages: [messageSchema],
    summary: [
        { type:String}
    ]
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);