// Lightweight wrapper for Gemini usage used by ChatApp.
// Keep this file as-is if you have @google/generative-ai installed and configured via VITE_GEMINI_API_KEY.
// If not configured, the ChatApp will gracefully show a fallback message.

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

let model = null;
if (apiKey) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { temperature: 0.7, topP: 0.8, topK: 40, maxOutputTokens: 2048 }
    });
  } catch (e) {
    console.warn("Failed to initialize Gemini client:", e);
    model = null;
  }
}

export function isGeminiConfigured() {
  return !!(apiKey && model);
}

export async function generateGeminiResponse(prompt, conversationHistory = []) {
  if (!isGeminiConfigured()) throw new Error("Gemini API not configured");
  try {
    const chat = model.startChat({ history: conversationHistory.map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text }] })) });
    const result = await chat.sendMessage(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error("generateGeminiResponse error:", err);
    throw err;
  }
}

export async function generateGeminiStreamResponse(prompt, conversationHistory = [], onChunk) {
  if (!isGeminiConfigured()) throw new Error("Gemini API not configured");
  try {
    const chat = model.startChat({ history: conversationHistory.map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text }] })) });
    const result = await chat.sendMessageStream(prompt);
    let full = "";
    try {
      for await (const chunk of result.stream) {
        const txt = chunk.text();
        if (txt) {
          full += txt;
          if (onChunk) onChunk(txt, false);
        }
      }
  // mark complete
  if (onChunk) onChunk(null, true);
  // final response awaited previously solely to avoid unhandled promise; not needed for current usage
  return full.trim();
    } catch (streamErr) {
      if (onChunk) onChunk(null, true, streamErr.message || "Stream interrupted");
      if (full.trim()) return full.trim();
      throw streamErr;
    }
  } catch (err) {
    console.error("generateGeminiStreamResponse error:", err);
    if (onChunk) onChunk(null, true, err.message || "Failed to stream");
    throw err;
  }
}
