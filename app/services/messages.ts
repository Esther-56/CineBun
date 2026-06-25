// services/messages.ts
import ForumApi from '../ApiCore';
const api = new ForumApi();

export interface Message {
  _id: string;
  content: string;
  sender: { _id: string; username: string; avatar?: string };
  createdAt: string;
  isRead: boolean;
}

export interface MessageUser { _id: string; username: string; avatar?: string | null; }
export interface DMMessage { _id: string; sender: MessageUser | string; content: string; createdAt: string; readAt: string | null; }

export interface Conversation {
  _id: string;
  participants: { _id: string; username: string; avatar?: string }[];
  unreadCount?: number;
  otherUser: MessageUser | null;
  lastMessage: { content: string; sender: string; createdAt: string } | null;
  unread: boolean;
  lastMessageAt: string;
  updatedAt: string;
  messages:DMMessage[]
  
}

export const MessageService = {
  listConversations: () =>
    api.get<{ success: boolean; data: { conversations: Conversation[] } }>('/messages'),

  getConversation: (id: string) =>
    api.get<{ success: boolean; data: { conversation: Conversation; messages: Message[] } }>(`/messages/${id}`),

  send: (data: { recipientId?: string; conversationId?: string; content: string }) =>
    api.post<{ success: boolean; data: { message: DMMessage; conversationId: string } }>('/messages', data),

  deleteConversation: (id: string) =>
    api.delete<{ success: boolean; data: { deleted: boolean } }>(`/messages/${id}`),

  deleteMessage: (conversationId: string, messageId: string) =>
    api.delete<{ success: boolean; data: { deleted: boolean } }>(`/messages/${conversationId}/messages/${messageId}`),

  unreadCount: () =>
    api.get<{ success: boolean; data: { unreadConversations: number } }>('/messages/unread-count'),

  
};