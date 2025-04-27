const topicModels = require('../../models/topic/topicIndex');
const { StatusCodes } = require('http-status-codes');
const { NotFoundError, CustomAPIError } = require('../../errors/index');
const axios = require('axios');

const getRevisionNotes = async (req, res) => {
    try {
        const topicId = req.query.topicId; // Change from req.body to req.query
        const userId = req.user.userId;

        if (!topicId) {
            throw new NotFoundError('Topic ID is required');
        }

        const revisionNotes = await topicModels.RevisionNotes.findOne({
            topicId,
            userId
        });
        
        if (!revisionNotes) {
            throw new NotFoundError('No revision notes found for this topic and user.');    
        }
        
        return res.status(StatusCodes.OK).json({
            message: 'Revision notes retrieved successfully',
            revisionNotes   
        });
    } catch (error) {
        if (error instanceof CustomAPIError) {
            return res.status(error.statusCode).json({ msg: error.message });
        } else {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                msg: 'Error retrieving revision notes',
                error: error.message
            });
        }   
    }
}

const createRevisionNotes = async (req, res) => {
    try {
        const { topicId } = req.body;
        const userId = req.user.userId;

        // Get chat history
        const chats = await topicModels.Chat.find({ 
            topicId, 
            userId, 
            parentChatId: null 
        }).sort({ createdAt: -1 });

        if (!chats || chats.length === 0) {
            throw new NotFoundError('No chat history found for this topic and user.');
        }

        let messages = [];
        let summary = [];
        for (const chat of chats) {
            messages = [...messages, ...chat.messages];
            summary = [...summary, ...chat.summary];
        }

        // Call Python API
        const apiResponse = await axios.post('http://127.0.0.1:8000/notes/', 
            { topicId, userId, messages, summary },
            { timeout: 600000 }
        );

        const responseData = apiResponse.data.message;

        // Use findOneAndUpdate to update or create notes
        const revisionNotes = await topicModels.RevisionNotes.findOneAndUpdate(
            { topicId, userId },
            {
                userId,
                topicId,
                title: responseData.title,
                introduction: responseData.introduction,
                core_concepts: responseData.core_concepts,
                example_or_use_case: responseData.example_or_use_case,
                common_confusions: responseData.common_confusions,
                memory_tips: responseData.memory_tips
            },
            {
                new: true,
                upsert: true
            }
        );

        return res.status(StatusCodes.CREATED).json({
            message: 'Revision notes created successfully',
            revisionNotes
        });
    } catch (error) {
        if (error instanceof CustomAPIError) {
            return res.status(error.statusCode).json({ msg: error.message });
        } else {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                msg: 'Error creating notes',
                error: error.message
            });
        }
    }
};

module.exports = {
    createRevisionNotes,
    getRevisionNotes
};