import { apiClient } from '../client';
import { UserProfilePayload } from '../../types';

export const userApi = {
  register: (payload: UserProfilePayload) => {
    return apiClient.post<{ message: string }>('/register', payload);
  },

  getProfile: (uid: string) => {
    return apiClient.get<UserProfilePayload>(`/users/${uid}`);
  },
};
