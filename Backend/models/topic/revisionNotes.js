const mongoose = require('mongoose');

const revisionNotesSchema = new mongoose.Schema({
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    introduction: {
        type: String,
        required: true
    },
    core_concepts: {
        type: [String], // Array of strings for multiple concepts
        required: true
    },
    example_or_use_case: {
        type: String,
        required: true
    },
    common_confusions: {
        type: [String], // Array of strings for multiple confusions
        required: true
    },
    memory_tips: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('RevisionNotes', revisionNotesSchema);