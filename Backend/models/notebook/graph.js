const mongoose = require('mongoose');

const graphSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    nodes: [{
        nodeId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'nodes.nodeType',
            required: true
        },
        nodeType: {
            type: String,
            required: true,
            enum: ['Folder', 'Topic', 'Resource']
        },
        label: String,
        x: Number,
        y: Number
    }],
    edges: [{
        source: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        target: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        type: String
    }]
});

module.exports = mongoose.model('Graph', graphSchema);