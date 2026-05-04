const axios = require('axios');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError, CustomAPIError } = require('../errors');
const Chat = require('../models/topic/chat'); // Import the Chat model
const topicModels = require('../models/topic/topicIndex');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';


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
        const { query, topicId, resourceId, chatId, parentId, modeId, mode } = req.body;
        const userId = req.user.userId;

        if (!query || !topicId || !resourceId) {
            throw new BadRequestError('Please provide a query, topicId, and resourceId');
        }

        let chatDoc, chatHistory = [], summary = [], referenceChats = [];

        if (parentId && !chatId) {
            // Create a new branch from parentId
            const parentChat = await Chat.findOne({
                _id: parentId,
                userId,
                topicId,
                resourceId
            });
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
                modeId: modeId || mode,
                messages: [],
                summary: []
            });
            chatHistory = parentChat.messages; // Use parent history for initial context
            summary = parentChat.summary || [];
            referenceChats = [parentChat._id, chatDoc._id];

        } else if (chatId) {
            // Continue an existing chat (parent or child)
            chatDoc = await Chat.findOne({
                _id: chatId,
                userId,
                topicId,
                resourceId
            });
            if (!chatDoc) throw new NotFoundError('Chat not found');

            // If this is a branch, include parent history for context
            if (chatDoc.parentChatId) {
                const parentChat = await Chat.findOne({
                    _id: chatDoc.parentChatId,
                    userId,
                    topicId,
                    resourceId
                });
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
            // Continue the latest root chat by default. The current frontend does
            // not send chatId, so creating a new chat here would break continuity.
            chatDoc = await Chat.findOne({
                topicId,
                resourceId,
                userId,
                parentChatId: null
            }).sort({ updatedAt: -1 });

            if (!chatDoc) {
                chatDoc = await Chat.create({
                    topicId,
                    resourceId,
                    userId,
                    parentChatId: null,
                    modeId: modeId || mode,
                    messages: [],
                    summary: []
                });
            }
            chatHistory = chatDoc.messages;
            summary = chatDoc.summary || [];
            referenceChats = [chatDoc._id];
        }
        // console.log('Chat History:', chatHistory);
        // Call Python API with the appropriate context
        const apiResponse = await axios.post(`${AI_SERVICE_URL}/respond/`, {
            user_query: query,
            messages: chatHistory,
            topicId,
            summary,
            resourceId,
            userId,
            modeId: modeId || mode
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
        chatDoc.modeId = modeId || mode || chatDoc.modeId;
        await chatDoc.save();

        return res.status(StatusCodes.OK).json({
            message: 'Chat processed successfully',
            chat: chatDoc,
            referenceChats, // For frontend to know context lineage
            metadata: apiResponse.data?.metadata || {}
        });

    } catch (error) {
        const upstreamError =
            error.response?.data?.error ||
            error.response?.data?.message ||
            error.message;

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Chat processing failed',
            error: upstreamError,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
};

const getChat = async (req, res) => {
    try {
        const { resourceId } = req.params;
        const userId = req.user.userId;

        const chatDoc = await Chat.findOne({
            resourceId,
            userId,
            parentChatId: null
        }).sort({ updatedAt: -1 });

        if (!chatDoc) {
            throw new NotFoundError('Chat not found');
        }

        const branches = await Chat.find({
            userId,
            resourceId,
            parentChatId: chatDoc._id
        }).sort({ createdAt: 1 });

        return res.status(StatusCodes.OK).json({
            message: 'Chat retrieved successfully',
            chat: chatDoc,
            branches
        });
    } catch (error) {
        if (error instanceof CustomAPIError) {
            return res.status(error.statusCode).json({ msg: error.message });
        }

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: 'Error retrieving chat',
            error: error.message
        });
    }
};

module.exports = {
    chat,
    getChat,
    // dummyChat
};
