import { apiClient } from '../client';

export interface LikeStatusResponse {
  liked: boolean;
  count: number;
}

export const likesApi = {
  addLike: (itemId: number, uid: string) => {
    return apiClient.post<{ message: string }>('/likes', {
      item_id: itemId,
      uid: uid,
    });
  },

  removeLike: (itemId: number, uid: string) => {
    return apiClient.delete<{ message: string }>('/likes', {
      item_id: itemId,
      uid: uid,
    });
  },

  getLikeStatus: (itemId: number, uid?: string) => {
    const params = new URLSearchParams({ item_id: itemId.toString() });
    if (uid) {
      params.append('uid', uid);
    }
    return apiClient.get<LikeStatusResponse>(`/likes/status?${params.toString()}`);
  },

  getUserLikes: (uid: string) => {
    return apiClient.get<{ item_ids: number[] }>(`/likes/user?uid=${encodeURIComponent(uid)}`);
  },
};
