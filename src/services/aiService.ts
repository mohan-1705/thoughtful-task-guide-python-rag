import { api } from './api';

export interface AskResponse {
  answer: string;
  retrieved_context: any[];
}

export const aiService = {
  askQuestion: async (question: string): Promise<AskResponse> => {
    const res = await api.post('/ask', { question });
    return res.data;
  },
};
