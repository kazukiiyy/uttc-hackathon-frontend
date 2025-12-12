import { apiClient } from '../client';
import { ItemCreatePayload, Item } from '../../types';

export const itemsApi = {
  create: (data: ItemCreatePayload) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('price', data.price);
    formData.append('explanation', data.explanation);
    formData.append('category', data.category);

    if (data.image) {
      formData.append('image', data.image);
    }

    return apiClient.postFormData<Item>('/items', formData);
  },

  getAll: () => {
    return apiClient.get<Item[]>('/items');
  },

  getById: (id: string) => {
    return apiClient.get<Item>(`/items/${id}`);
  },
};
