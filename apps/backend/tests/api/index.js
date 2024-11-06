import express from 'express';

import { authorize } from '../../shared/auth/mw.js';
import ctrl from './seed.controller.js';

const router = express.Router();

router
  .use(authorize())
  .post('/reset', ctrl.resetDatabase)
  .post('/user', ctrl.seedUser);

export default {
  path: '/seed',
  router,
};
