import express from 'express';
import ctrl from './ai.controller.js';

const router = express.Router();

router.post('/prompt', ctrl.prompt);

export default {
  path: '/ai',
  router,
};
