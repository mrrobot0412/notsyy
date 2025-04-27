import axios from '../utils/axios';

export const getRevisionNotes = async (topicId) => {
  try {
    console.log('Calling getRevisionNotes with topicId:', topicId);
    const response = await axios.get(`/revisionNotes?topicId=${topicId}`);
    console.log('Notes API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in getRevisionNotes:', error);
    throw error;
  }
};

export const createRevisionNotes = async (topicId) => {
  try {
    console.log('Creating revision notes for topicId:', topicId);
    const response = await axios.post('/revisionNotes', { topicId });
    console.log('Create notes response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in createRevisionNotes:', error);
    throw error;
  }
};