import apiClient from './authService';

export function isGeminiConfigured() {
  // Backend holds the API key, so assume configured.
  return true;
}

const mapHistory = (history = []) =>
  Array.isArray(history)
    ? history.map((msg) => ({ role: msg.role, text: msg.text }))
    : [];

export async function generateGeminiResponse(prompt, conversationHistory = []) {
  const response = await apiClient.post('/api/ai/gemini', {
    prompt,
    history: mapHistory(conversationHistory),
  });
  return response.data?.text?.trim() || '';
}

export async function generateGeminiStreamResponse(prompt, conversationHistory = [], onChunk) {
  try {
    const response = await apiClient.post('/api/ai/gemini', {
      prompt,
      history: mapHistory(conversationHistory),
    });

    const text = response.data?.text?.trim() || '';

    if (text && onChunk) {
      onChunk(text, false);
      onChunk(null, true);
    }

    return text;
  } catch (err) {
    const message = err.response?.data?.message || err.message || 'Failed to contact AI service';
    if (onChunk) {
      onChunk(null, true, message);
    }
    throw new Error(message);
  }
}
