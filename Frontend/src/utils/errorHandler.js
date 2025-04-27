import { toast } from 'react-hot-toast';

export const handleError = (error) => {
  if (error.response) {
    // Server responded with error
    switch (error.response.status) {
      case 400:
        toast.error(error.response.data.error || 'Bad Request');
        break;
      case 401:
        toast.error('Session expired. Please login again.');
        break;
      case 403:
        toast.error('Access denied');
        break;
      case 404:
        toast.error('Resource not found');
        break;
      default:
        toast.error('Something went wrong');
    }
  } else if (error.request) {
    // Request made but no response
    toast.error('Network error. Please check your connection.');
  } else {
    // Error in request configuration
    toast.error('An error occurred');
  }
};