import apiClient from './authService';

const normalizeMessagePayload = (messages = []) =>
  (Array.isArray(messages) ? messages : [])
    .map((msg) => {
      if (!msg || typeof msg.text !== 'string') return null;
      const text = msg.text.trim();
      if (!text) return null;
      return {
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        text,
        time:
          typeof msg.time === 'string' && msg.time.trim().length > 0
            ? msg.time.trim()
            : new Date().toISOString(),
      };
    })
    .filter(Boolean);

export const fetchChats = async () => {
  const response = await apiClient.get('/api/chats');
  return response.data || [];
};

export const createChat = async ({ title, messages = [] }) => {
  const payload = {
    title,
    messages: normalizeMessagePayload(messages),
  };
  const response = await apiClient.post('/api/chats', payload);
  return response.data;
};

export const appendMessages = async (chatId, messages = []) => {
  const response = await apiClient.post(`/api/chats/${chatId}/messages`, {
    messages: normalizeMessagePayload(messages),
  });
  return response.data;
};

export const updateChat = async (chatId, updates = {}) => {
  const response = await apiClient.patch(`/api/chats/${chatId}`, updates);
  return response.data;
};

export const deleteChat = (chatId) => apiClient.delete(`/api/chats/${chatId}`);
