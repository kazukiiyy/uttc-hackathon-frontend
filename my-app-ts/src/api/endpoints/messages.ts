import { apiClient } from '../client';

export interface Message {
  id: number;
  sender_uid: string;
  receiver_uid: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  partner_uid: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export const messagesApi = {
  // 相手とのメッセージ一覧を取得
  getMessages: (myUid: string, partnerUid: string) => {
    return apiClient.get<Message[]>(
      `/messages?my_uid=${encodeURIComponent(myUid)}&partner_uid=${encodeURIComponent(partnerUid)}`
    );
  },

  // メッセージを送信
  sendMessage: (senderUid: string, receiverUid: string, content: string) => {
    return apiClient.post<Message>('/messages/send', {
      sender_uid: senderUid,
      receiver_uid: receiverUid,
      content,
    });
  },

  // メッセージを既読にする
  markAsRead: (myUid: string, partnerUid: string) => {
    return apiClient.put<{ message: string }>('/messages/read', {
      my_uid: myUid,
      partner_uid: partnerUid,
    });
  },

  // 会話一覧を取得
  getConversations: (uid: string) => {
    return apiClient.get<Conversation[]>(
      `/messages/conversations?uid=${encodeURIComponent(uid)}`
    );
  },
};
