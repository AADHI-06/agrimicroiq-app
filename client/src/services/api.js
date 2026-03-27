import axios from 'axios';
import { auth } from '../firebase';

// Use relative URL by default for Firebase Hosting environment
const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Attach Firebase token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Secure Response Payload Unpacker Array
api.interceptors.response.use(
  (response) => {
    // Automatically unpack wrapped global APIs explicitly so existing component state tracking functions seamlessly
    if (response.data && response.data.success === true && response.data.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
