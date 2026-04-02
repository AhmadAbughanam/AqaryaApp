// Chatbot service that orchestrates context handling and local LLM calls.
import {localLLMClient} from './llmClient';
import {
  applyTemplate,
  PROPERTY_OVERVIEW_TEMPLATE,
} from './promptTemplates';

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

// Maintains a bounded chat context to avoid unbounded memory/token growth.
export const manageChatContext = (
  history: ChatMessage[],
  nextMessage: ChatMessage,
  maxMessages: number = 20,
): ChatMessage[] => {
  const merged = [...history, nextMessage];
  return merged.slice(-maxMessages);
};

// Sends user input to local LLM using a simple template and returns assistant reply message.
export const sendMessageToLocalLLM = async (
  input: string,
  history: ChatMessage[],
): Promise<{reply: ChatMessage; updatedContext: ChatMessage[]}> => {
  const userMessage: ChatMessage = {
    id: `user-${Date.now()}`,
    role: 'user',
    content: input,
    createdAt: new Date().toISOString(),
  };

  const contextWithUser = manageChatContext(history, userMessage);

  // Placeholder prompt composition:
  // In real usage, choose template based on intent/classification.
  const prompt = applyTemplate(PROPERTY_OVERVIEW_TEMPLATE, input);

  // Real local model call would happen behind localLLMClient.sendPrompt.
  const outputText = await localLLMClient.sendPrompt(prompt);

  const assistantMessage: ChatMessage = {
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: outputText,
    createdAt: new Date().toISOString(),
  };

  const updatedContext = manageChatContext(contextWithUser, assistantMessage);

  return {reply: assistantMessage, updatedContext};
};
