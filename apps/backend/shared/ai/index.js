import ctrl from './ai.controller.js';
import express from 'express';

const router = express.Router();

router.post('/prompt', ctrl.prompt);

export default {
  path: '/ai',
  router,
};
