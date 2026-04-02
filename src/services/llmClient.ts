// Local LLM client scaffold for React Native (no external API keys).

export interface LocalLLMConfig {
  modelName: string;
  endpoint?: string;
}

export interface PromptOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface LocalLLMClient {
  sendPrompt: (prompt: string, options?: PromptOptions) => Promise<string>;
}

// Creates a local-LLM client contract.
// Replace placeholder response logic with real local inference calls (e.g., on-device model or local server).
export const createLocalLLMClient = (
  config: LocalLLMConfig = {modelName: 'local-placeholder-model'},
): LocalLLMClient => {
  const sendPrompt = async (
    prompt: string,
    options: PromptOptions = {},
  ): Promise<string> => {
    const cleanedPrompt = prompt.trim();

    if (!cleanedPrompt) {
      return 'Please enter a message for the local assistant.';
    }

    // Placeholder behavior:
    // In production, call the actual local LLM runtime here and return model output text.
    return Promise.resolve(
      `[${config.modelName}] Placeholder response for: ${cleanedPrompt}`,
    );
  };

  return {sendPrompt};
};

// Shared default client instance used by services/screens.
export const localLLMClient = createLocalLLMClient();
