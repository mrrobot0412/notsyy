const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
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
    topic: {
        type: String,
        required: true
    },
    flashcards: [
        {
            concept: {
                type: String,
                required: true
            },
            explanation: {
                type: String,
                required: true
            },
            color: {
                type: String,
                enum: ['red', 'yellow', 'green'],
                required: true
            }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Flashcard', flashcardSchema);