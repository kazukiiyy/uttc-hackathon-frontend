import { apiClient } from '../client';

export interface GeminiGenerateRequest {
  prompt: string;
  protocol?: string;
}

export interface GeminiGenerateResponse {
  response: string;
  error?: string;
}

export const geminiApi = {
  generate: (data: GeminiGenerateRequest) => {
    return apiClient.post<GeminiGenerateResponse>('/api/v1/gemini/generate', {
      prompt: data.prompt,
      protocol: data.protocol || '',
    });
  },
};

