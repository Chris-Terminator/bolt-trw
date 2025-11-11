import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class MoonshotProvider extends BaseProvider {
  name = 'Moonshot';
  getApiKeyLink = 'https://platform.moonshot.ai/console/api-keys';

  config = {
    apiTokenKey: 'MOONSHOT_API_KEY',
  };

  staticModels: ModelInfo[] = [
    { name: 'kimi-k2-0905-preview', label: 'Kimi K2 0905', provider: 'Moonshot', maxTokenAllowed: 262144 },
    { name: 'kimi-k2-turbo-preview', label: 'Kimi K2 Turbo', provider: 'Moonshot', maxTokenAllowed: 262144 },
    { name: 'kimi-k2-thinking', label: 'Kimi K2 Thinking', provider: 'Moonshot', maxTokenAllowed: 262144 },
  ];

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
      defaultApiTokenKey: 'MOONSHOT_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const openai = createOpenAI({
      baseURL: 'https://api.moonshot.ai/v1',
      apiKey,
    });

    return openai(model);
  }
}
