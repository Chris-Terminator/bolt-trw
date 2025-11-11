import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { LanguageModelV1 } from 'ai';
import type { IProviderSetting } from '~/types/model';
import { createOpenAI } from '@ai-sdk/openai';

export default class MiniMaxProvider extends BaseProvider {
  name = 'MiniMax';
  getApiKeyLink = 'https://platform.minimax.io';

  config = {
    apiTokenKey: 'MINIMAX_API_KEY',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'MiniMax-M2',
      label: 'MiniMax-M2',
      provider: 'MiniMax',
      maxTokenAllowed: 204800,
      maxCompletionTokens: 131072,
    },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    // MiniMax doesn't support dynamic model listing via API
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
      defaultApiTokenKey: this.config.apiTokenKey,
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    return createOpenAI({
      apiKey,
      baseURL: 'https://api.minimax.io/v1',
    })(model);
  }
}
