import api from './api';

export const syncUser = async () => {
  const response = await api.post('/auth/sync');
  return response.data;
};
