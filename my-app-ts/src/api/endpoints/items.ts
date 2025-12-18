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
    // バックエンドではcategoryまたはuidが必要なため、全件取得はgetLatestを使用
    // または空の配列を返す（実際の使用箇所を確認して適切に修正）
    return apiClient.get<Item[]>('/getItems/latest?limit=100');
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

  getPurchasedItems: (buyerUid: string, buyerAddress?: string) => {
    const params = new URLSearchParams();
    if (buyerUid) {
      params.append('buyer_uid', buyerUid);
    }
    if (buyerAddress) {
      params.append('buyer_address', buyerAddress);
    }
    return apiClient.get<PurchasedItem[]>(
      `/purchases?${params.toString()}`
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

  // 画像のみをアップロードしてURLを取得（onchain出品用）
  uploadImage: (image: File) => {
    const formData = new FormData();
    formData.append('image', image);
    return apiClient.postFormData<{ image_url: string; image_urls: string[] }>('/uploadImage', formData);
  },
};
