import * as Joi from 'joi';

import { authValidationSchema } from './auth.config';
import { dbValidationSchema } from './db.config';
import { generalValidationSchema } from './general.config';
import { mailValidationSchema } from './mail.config';

export const validationSchema = Joi.object({
  ...authValidationSchema,
  ...dbValidationSchema,
  ...generalValidationSchema,
  ...mailValidationSchema,
});
