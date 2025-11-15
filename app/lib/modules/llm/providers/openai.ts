import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class OpenAIProvider extends BaseProvider {
  name = 'OpenAI';
  getApiKeyLink = 'https://platform.openai.com/api-keys';

  config = {
    apiTokenKey: 'OPENAI_API_KEY',
  };

  staticModels: ModelInfo[] = [
    /*
     * Essential fallback models - only the most stable/reliable ones
     * GPT-4o: 128k context, 4k standard output (64k with long output mode)
     */
    { name: 'gpt-5.1', label: 'GPT-5.1', provider: 'OpenAI', maxTokenAllowed: 400000, maxCompletionTokens: 128000 },

    // GPT-4o Mini: 128k context, cost-effective alternative
    {
      name: 'gpt-5-mini',
      label: 'GPT-5 Mini',
      provider: 'OpenAI',
      maxTokenAllowed: 400000,
      maxCompletionTokens: 128000,
    },

    // GPT-3.5-turbo: 16k context, fast and cost-effective
    {
      name: 'gpt-4.1',
      label: 'GPT-4.1',
      provider: 'OpenAI',
      maxTokenAllowed: 1047576,
      maxCompletionTokens: 32768,
    },

    // o1-preview: 128k context, 32k output limit (reasoning model)
    {
      name: 'gpt-5.1-codex',
      label: 'GPT-5.1 Codex',
      provider: 'OpenAI',
      maxTokenAllowed: 400000,
      maxCompletionTokens: 128000,
    },

    // o1-mini: 128k context, 65k output limit (reasoning model)
    { name: 'gpt-5.1-codex-mini', label: 'GPT-5.1 Codex Mini', provider: 'OpenAI', maxTokenAllowed: 400000, maxCompletionTokens: 128000 },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    // Return static models only
    return [];
  }
  
  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'OPENAI_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const openai = createOpenAI({
      apiKey,
    });

    return openai(model);
  }
}
