import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3000/notsy', // Make sure this matches your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Make sure token is being sent
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;