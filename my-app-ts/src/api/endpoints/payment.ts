import { config } from '../../config/env';

// 支払い注文のレスポンス型
export interface PaymentOrder {
  order_id: string;
  product_id: string;
  product_name: string;
  price_yen: number;
  amount_eth: string;
  amount_wei: string;
  payment_addr: string;
  buyer_wallet: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'PAYMENT_ERROR';
  tx_hash: string;
  created_at: string;
}

// 支払い注文作成リクエスト
interface CreateOrderRequest {
  product_id: string;
  buyer_wallet: string;
}

// 支払い確認リクエスト
interface ConfirmPaymentRequest {
  order_id: string;
  product_id: string;
  tx_hash: string;
}

class PaymentApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.paymentApiBaseUrl;
  }

  // 支払い注文を作成（支払い情報を取得）
  async createOrder(productId: string, buyerWallet: string): Promise<PaymentOrder> {
    const response = await fetch(`${this.baseUrl}/api/v1/payment/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        buyer_wallet: buyerWallet,
      } as CreateOrderRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '支払い注文の作成に失敗しました');
    }

    return response.json();
  }

  // 支払いを確認（トランザクション検証）
  async confirmPayment(orderId: string, productId: string, txHash: string): Promise<PaymentOrder> {
    const response = await fetch(`${this.baseUrl}/api/v1/payment/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: orderId,
        product_id: productId,
        tx_hash: txHash,
      } as ConfirmPaymentRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '支払いの確認に失敗しました');
    }

    return response.json();
  }
}

export const paymentApi = new PaymentApi();
