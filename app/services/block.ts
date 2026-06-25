// services/block.ts
import ForumApi from '../ApiCore';
const api = new ForumApi();

export const BlockService = {
  toggle: (targetId: string, action: 'block' | 'unblock') =>
    api.post<{ success: boolean; data: { message: string } }>('/messages/block', { targetId, action }),

  setPrivacy: (privacy: 'everyone' | 'nobody') =>
    api.patch<{ success: boolean; data: { message: string } }>('/messages/block', { privacy }),
};