const topicModels = require('../../models/topic/topicIndex');
const { StatusCodes } = require('http-status-codes');
const { NotFoundError, CustomAPIError } = require('../../errors/index');
const axios = require('axios');

const getFlashcards = async (req, res) => {
    try {
        const topicId = req.query.topicId; // Get from query instead of body
        const userId = req.user.userId;

        if (!topicId) {
            throw new CustomAPIError('Topic ID is required', 400);
        }

        // Retrieve flashcards for this topic and user
        const flashcards = await topicModels.Flashcard.findOne({ 
            topicId, 
            userId 
        });

        if (!flashcards) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'No flashcards found for this topic and user.'
            });
        }

        return res.status(StatusCodes.OK).json({
            message: 'Flashcards retrieved successfully',
            flashcards
        });
    } catch (error) {
        console.error('Error retrieving flashcards:', error);
        if (error instanceof CustomAPIError) {
            return res.status(error.statusCode).json({ msg: error.message });
        }
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: 'Error retrieving flashcards',
            error: error.message
        });
    }
}

const createFlashcards = async (req, res) => {
    try {
        const { topicId } = req.body;
        const userId = req.user.userId;

        // Retrieve top-level chats for this topic and user
        const chats = await topicModels.Chat.find({ 
            topicId, 
            userId, 
            parentChatId: null // exclude chats that are replies
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

        // Call the Python API to generate flashcards
        const apiResponse = await axios.post('http://127.0.0.1:8000/cards/', 
            { topicId, userId, messages, summary },
            { timeout: 600000 }
        );

        const responseData = apiResponse.data.message;

        const flashcards=await topicModels.Flashcard.findOneAndUpdate(
            {topicId,userId},
            {
                topicId,
                userId,
                topic:responseData.topic,
                flashcards:responseData.flashcards.map(card=>({
                    concept:card.concept,
                    explanation:card.explanation,
                    color:card.color           
                }))

            },{
                new:true,
                upsert:true,
                
            }

        )

        // Save the topic and flashcards in the database
        // const flashcards = await topicModels.Flashcard.create({
        //     userId,
        //     topicId,
        //     topic: responseData.topic,
        //     flashcards: responseData.flashcards.map(card => ({
        //         concept: card.concept,
        //         explanation: card.explanation,
        //         color: card.color
        //     }))
        // });

        return res.status(StatusCodes.CREATED).json({
            message: 'Flashcards created successfully',
            flashcards
        });
    } catch (error) {
        console.error('Error creating flashcards:', error);
        if (error instanceof CustomAPIError) {
            return res.status(error.statusCode).json({ msg: error.message });
        } else {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                msg: 'Error creating flashcards',
                error: error.message
            });
        }
    }
};

module.exports = {
    createFlashcards,
    getFlashcards
};