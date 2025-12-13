import { apiClient } from '../client';
import { ItemCreatePayload, Item } from '../../types';

export const itemsApi = {
  create: (data: ItemCreatePayload) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('price', data.price);
    formData.append('explanation', data.explanation);
    formData.append('category', data.category);
    formData.append('sellerUid', data.sellerUid);

    if (data.image) {
      formData.append('image', data.image);
    }

    return apiClient.postFormData<Item>('/postItems', formData);
  },

  getAll: () => {
    return apiClient.get<Item[]>('/getItems');
  },

  getById: (id: string) => {
    return apiClient.get<Item>(`/getItems/${id}`);
  },

  getByCategory: (category: string, page: number = 1, limit: number = 20) => {
    return apiClient.get<Item[]>(
      `/getItems?category=${encodeURIComponent(category)}&page=${page}&limit=${limit}`
    );
  },

  getByUid: (uid: string) => {
    return apiClient.get<Item[]>(`/getItems?uid=${encodeURIComponent(uid)}`);
  },
};
