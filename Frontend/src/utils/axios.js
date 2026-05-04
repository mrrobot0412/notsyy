import axios from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '/notsy';

export const ASSET_BASE_URL = API_BASE_URL.replace(/\/notsy\/?$/, '');

const instance = axios.create({
  baseURL: API_BASE_URL,
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
