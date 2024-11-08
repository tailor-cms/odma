import isString from 'lodash/isString.js';
import OpenAI from 'openai';

import { createLogger } from '#logger';
import { ai as aiConfig } from '#config';

const logger = createLogger('ai');

const systemPrompt = `
  The following is a conversation with an AI assistant.
  The assistant is helpful, creative, clever, and very friendly.

  Rules:
  - Use the User rules to generate the content
  - Generated content should have a friendly tone and be easy to understand
  - Generated content should not include any offensive language or content
  - Only return JSON objects`;

const parseResponse = (val) => {
  const content = val?.choices?.[0]?.message?.content;
  logger.info('Response content', content);
  try {
    if (!isString(content)) return content;
    return JSON.parse(content);
  } catch {
    logger.info('Unable to parse response', content);
    throw new Error('Invalid AI response', content);
  }
};

class AIService {
  #openai;

  constructor() {
    this.#openai = new OpenAI({ apiKey: aiConfig.secretKey });
  }

  async requestCompletion(prompt) {
    logger.info('Completion request', prompt);
    const completion = await this.#openai.chat.completions.create({
      model: aiConfig.modelId,
      temperature: 0.5,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    });
    logger.info('Completion response', completion);
    return parseResponse(completion);
  }

  async generateImage(prompt) {
    const { data } = await this.#openai.images.generate({
      prompt,
      model: 'dall-e-3',
      n: 1, // amount of images, max 1 for dall-e-3
      quality: 'hd', // 'standard' | 'hd',
      size: '1024x1024',
      style: 'natural',
    });
    const url = new URL(data[0].url);
    return url;
  }
}

export default aiConfig.secretKey ? new AIService() : {};
