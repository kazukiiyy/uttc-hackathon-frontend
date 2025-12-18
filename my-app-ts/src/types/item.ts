export interface ItemCreatePayload {
  title: string;
  price: string;
  explanation: string;
  image: File | null;
  sellerUid: string;
  category: string;
}

export interface Item {
  id: number;
  title: string;
  price: number;
  explanation: string;
  image_urls?: string[];
  uid: string;
  ifPurchased: boolean;
  category: string;
  like_count: number;
  created_at: string;
  chain_item_id?: number;
}
