import { randomUUID } from 'crypto';

const resolvePinoTransport = (isProduction: boolean) => {
  if (isProduction) return;
  return {
    target: require.resolve('pino-pretty'),
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  };
};

export default (level, isProd) => ({
  pinoHttp: {
    level,
    // prevent req from being attached to child loggers
    // this prevents requests from being logged upon every child logger call
    // while still allowing us to log request info in the main logger
    // (e.g. upon logging in services, request info is not repeated)
    quietReqLogger: true,
    autoLogging: { ignore: () => false },
    transport: resolvePinoTransport(isProd),
    genReqId: (req) => req.headers['x-request-id'] || randomUUID(),
    customProps: (req) => ({ reqId: req.id }),
    customSuccessMessage: (req, res) =>
      `${req.method} ${req.url} → ${res.statusCode}`,
    customErrorMessage: (req, res, { message }) =>
      `${req.method} ${req.url} → ${res.statusCode} - ${message}`,
    serializers: {
      req: (req) => ({ method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  },
});
