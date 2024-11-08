/* eslint-disable */
import boxen, { type Options as BoxenOptions } from 'boxen';
import Promise from 'bluebird';

import app from './app.ts';
import config from '#config';
import { createLogger } from './shared/logger.js';


// This needs to be done before db models get loaded!
Promise.config({ longStackTraces: !config.isProduction });
import database from './shared/database/index.js';
/* eslint-enable */

const logger = createLogger();
database
  .initialize()
  .then(() => logger.info('Database initialized'))
  .then(() => app.listen(config.port))
  .then(() => {
    logger.info(`Server listening on port ${config.port}`);
    welcome(config.packageName, config.packageVersion);
  })
  .catch((err) => logger.error({ err }));

const message = (name, version) => `${name} v${version} 🚀`.trim();

function welcome(name, version) {
  const options = {
    padding: 2,
    margin: 1,
    borderStyle: 'double',
    borderColor: 'blue',
    align: 'left',
  } as BoxenOptions;
  console.log(boxen(message(name, version), options));
}
