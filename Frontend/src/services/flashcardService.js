import axios from '../utils/axios';

export const getFlashcards = async (topicId) => {
    try {
        console.log('Fetching flashcards for topicId:', topicId);
        const response = await axios.get('/flashcards', { 
            params: { topicId } // Send as query parameter instead of body
        });
        console.log('Get flashcards response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching flashcards:', error);
        // Return null if 404 to handle "no flashcards yet" case
        if (error.response?.status === 404) {
            return null;
        }
        throw error;
    }
};

export const createFlashcards = async (topicId) => {
    try {
        console.log('Creating flashcards for topicId:', topicId);
        const response = await axios.post('/flashcards', { topicId });
        console.log('Create flashcards response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating flashcards:', error);
        throw error;
    }
};