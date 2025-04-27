import axios from '../utils/axios';

export const sendChatMessage = async (chatData) => {
  try {
    const response = await axios.post('/chat', chatData);
    return response.data;
  } catch (error) {
    console.error('Chat service error:', {
      status: error.response?.status,
      message: error.response?.data?.msg || error.message,
      endpoint: '/chat'
    });
    throw error;
  }
};

export const getChatHistory = async (resourceId) => {
  try {
    const response = await axios.get(`/chat/history/${resourceId}`);
    return response.data;
  } catch (error) {
    console.error('Chat history error:', error);
    throw error;
  }
};