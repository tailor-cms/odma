import AIService from './ai.service.js';

async function prompt(req, res) {
  const data = await AIService.requestCompletion(req.body?.input);
  res.json({ data });
}

export default {
  prompt,
};
