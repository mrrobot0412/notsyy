const axios = require('axios');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError, CustomAPIError } = require('../errors');
const Chat = require('../models/topic/chat'); // Import the Chat model
const topicModels = require('../models/topic/topicIndex');



// const chat = async (req, res) => {
//     try {
//         const { query, topicId, resourceId } = req.body;

//         if (!query || !topicId || !resourceId) {
//             throw new BadRequestError('Please provide a query, topicId, and resourceId');
//         }

//         const userId = req.user.userId;

//         // 1. Get existing chat history for the resource
//         const existingChat = await Chat.findOne({ resourceId }).sort({ createdAt: -1 });

//         let chatHistory = [];
//         let parentChatId = null;

//         if (existingChat) {
//             chatHistory = existingChat.messages;
//             parentChatId = existingChat._id;
//         }

//         // 2. Call Python API
//         const apiResponse = await axios.post('http://127.0.0.1:8000/respond/', {
//             user_query: query,
//             messages: chatHistory,
//             topicId,
//             summary: existingChat?.summary || [],
//             resourceId,
//             userId: userId
//         }, { timeout: 60000 });

//         console.log('Python API Response:', apiResponse.data);

//         const assistantResponse = apiResponse.data?.message;
//         if (!assistantResponse?.trim()) {
//             throw new Error('Invalid response format from Python API');
//         }

//         // 3. Create new message objects
//         const newMessages = [
//             { role: 'user', content: query.trim() },
//             { role: 'assistant', content: assistantResponse.trim() }
//         ];

//         // 4. If an existing chat is found, update it; otherwise, create a new chat document
//         if (existingChat) {
//             // Append new messages to the existing chat's messages array
//             existingChat.messages = [...existingChat.messages, ...newMessages];
//             // Optionally update the summary if needed
//             existingChat.summary = apiResponse.data.summary || existingChat.summary;
//             await existingChat.save();

//             return res.status(StatusCodes.OK).json({
//                 message: 'Chat processed successfully',
//                 chat: existingChat
//             });
//         } else {
//             const newChat = await Chat.create({
//                 topicId,
//                 resourceId,
//                 userId,
//                 messages: newMessages,
//                 summary: apiResponse.data.summary || []
//             });

//             return res.status(StatusCodes.OK).json({
//                 message: 'Chat processed successfully',
//                 chat: newChat
//             });
//         }

//     } catch (error) {
//         console.error('Chat Error:', error);
//         return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//             message: 'Chat processing failed',
//             error: error.message,
//             ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
//         });
//     }
// };

const chat = async (req, res) => {
    try {
        // console.log('Chat Request Body:', req.body);
        const { query, topicId, resourceId, chatId, parentId } = req.body;
        const userId = req.user.userId;

        if (!query || !topicId || !resourceId) {
            throw new BadRequestError('Please provide a query, topicId, and resourceId');
        }

        let chatDoc, chatHistory = [], summary = [], referenceChats = [];

        if (parentId && !chatId) {
            // Create a new branch from parentId
            const parentChat = await Chat.findById(parentId);
            if (!parentChat) throw new NotFoundError('Parent chat not found');

            // Optionally: Prevent branching from a branch (enforce only one level)
            if (parentChat.parentChatId) {
                throw new BadRequestError('Cannot branch from a child branch');
            }

            // Create the branch
            chatDoc = await Chat.create({
                topicId,
                resourceId,
                userId,
                parentChatId: parentId,
                messages: [],
                summary: []
            });
            chatHistory = parentChat.messages; // Use parent history for initial context
            summary = parentChat.summary || [];
            referenceChats = [parentChat._id, chatDoc._id];

        } else if (chatId) {
            // Continue an existing chat (parent or child)
            chatDoc = await Chat.findById(chatId);
            if (!chatDoc) throw new NotFoundError('Chat not found');

            // If this is a branch, include parent history for context
            if (chatDoc.parentChatId) {
                const parentChat = await Chat.findById(chatDoc.parentChatId);
                if (!parentChat) throw new NotFoundError('Parent chat not found');
                chatHistory = [...parentChat.messages, ...chatDoc.messages];
                summary = chatDoc.summary || [];
                referenceChats = [parentChat._id, chatDoc._id];
            } else {
                chatHistory = chatDoc.messages;
                summary = chatDoc.summary || [];
                referenceChats = [chatDoc._id];
            }
        } else {
            // Create a new root chat
            chatDoc = await Chat.create({
                topicId,
                resourceId,
                userId,
                messages: [],
                summary: []
            });
            chatHistory = chatDoc.messages;
            summary = [];
            referenceChats = [chatDoc._id];
        }
        // console.log('Chat History:', chatHistory);
        // Call Python API with the appropriate context
        const apiResponse = await axios.post('http://127.0.0.1:8000/respond/', {
            user_query: query,
            messages: chatHistory,
            topicId,
            summary,
            resourceId,
            userId
        }, { timeout: 60000 });
    console.log('Python API Response:', apiResponse.data);
        const assistantResponse = apiResponse.data?.message;
        if (!assistantResponse?.trim()) {
            throw new Error('Invalid response format from Python API');
        }

        // Add assistant's message to the chat
        chatDoc.messages.push({ role: 'user', content: query.trim() });
        chatDoc.messages.push({ role: 'assistant', content: assistantResponse.trim() });
        chatDoc.summary = apiResponse.data.summary || chatDoc.summary;
        await chatDoc.save();

        return res.status(StatusCodes.OK).json({
            message: 'Chat processed successfully',
            chat: chatDoc,
            referenceChats // For frontend to know context lineage
        });

    } catch (error) {
        // console.error('Chat Error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Chat processing failed',
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
};

module.exports = {
    chat,
    // dummyChat
};