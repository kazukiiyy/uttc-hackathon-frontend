export interface ItemCreatePayload {
  title: string;
  price: string;
  explanation: string;
  image: File | null;
  sellerUid: string;
  category: string;
}

export interface Item {
  id: string;
  title: string;
  price: number;
  explanation: string;
  imageUrl?: string;
  sellerUid: string;
  category: string;
  createdAt?: Date;
}
