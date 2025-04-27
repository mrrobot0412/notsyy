import axios from '../utils/axios';

export const uploadPDFs = async (files, topicId) => {
  if (!Array.isArray(files)) {
    throw new Error('Files must be an array');
  }

  const formData = new FormData();
  
  // Append each PDF file
  files.forEach(file => {
    formData.append('pdf', file);
  });
  
  formData.append('topicId', topicId);

  try {
    const response = await axios.post('/upload/uploadPdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Return the newResource object from the response
    return {
      data: response.data.newResource,
      message: response.data.message
    };
  } catch (error) {
    console.error('PDF upload error details:', error.response?.data);
    throw error;
  }
};