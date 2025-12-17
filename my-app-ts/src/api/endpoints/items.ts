import { apiClient } from '../client';
import { ItemCreatePayload, Item } from '../../types';

export interface PurchasedItem {
  id: number;
  title: string;
  price: number;
  explanation: string;
  image_urls: string[];
  uid: string;
  category: string;
  purchased_at: string;
}

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

  purchase: (itemId: number, buyerUid: string) => {
    return apiClient.put<{ message: string }>(`/items/${itemId}/purchase`, {
      buyer_uid: buyerUid,
    });
  },

  getPurchasedItems: (buyerUid: string) => {
    return apiClient.get<PurchasedItem[]>(
      `/purchases?buyer_uid=${encodeURIComponent(buyerUid)}`
    );
  },

  getLatest: (limit: number = 10) => {
    return apiClient.get<Item[]>(`/getItems/latest?limit=${limit}`);
  },

  getByIds: async (ids: number[]): Promise<Item[]> => {
    if (ids.length === 0) return [];
    // 個別に取得して結合
    const items = await Promise.all(
      ids.map(id => apiClient.get<Item>(`/getItems/${id}`).catch(() => null))
    );
    return items.filter((item): item is Item => item !== null);
  },
};
