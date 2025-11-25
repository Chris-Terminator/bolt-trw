import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { LanguageModelV1 } from 'ai';
import type { IProviderSetting } from '~/types/model';
import { createOpenAI } from '@ai-sdk/openai';

export default class GLMCodingProvider extends BaseProvider {
  name = 'GLM Code Plan';
  getApiKeyLink = 'https://z.ai/subscribe';

  config = {
    apiTokenKey: 'ZAI_API_KEY',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'glm-4.6',
      label: 'GLM-4.6',
      provider: 'GLM Code Plan',
      maxTokenAllowed: 204800,
      maxCompletionTokens: 131072,
    },
    {
      name: 'glm-4.5-air',
      label: 'GLM-4.5 Air',
      provider: 'GLM Code Plan',
      maxTokenAllowed: 131072,
      maxCompletionTokens: 98304,
    },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    // Z AI doesn't support dynamic model listing via API
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
      baseURL: 'https://api.z.ai/api/coding/paas/v4',
      compatibility: "compatible",
    })(model);
  }
}
