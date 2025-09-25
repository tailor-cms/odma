import isLocalhost from 'is-localhost';

export function resolveOrigin(env) {
  const { HOSTNAME: hostname } = env;
  const protocol = env.PROTOCOL ? env.PROTOCOL : resolveProtocol(hostname);
  const port = resolvePort(env);
  const origin = resolveOriginUrl(
    hostname,
    protocol,
    port,
    env.REVERSE_PROXY_PORT,
  );
  return { hostname, protocol, port, origin };
}

function resolveProtocol(hostname) {
  return isLocalhost(hostname) ? 'http' : 'https';
}

function resolvePort(env) {
  return env.PORT || 3000;
}

function resolveOriginPort(port, reverseProxyPort) {
  if (!reverseProxyPort) return `:${port}`;
  if (reverseProxyPort === '80' || reverseProxyPort === '443') return '';
  return `:${reverseProxyPort}`;
}

function resolveOriginUrl(
  hostname = 'localhost',
  protocol = 'http',
  port = 3000,
  reverseProxyPort,
) {
  return `${protocol}://${hostname}${resolveOriginPort(
    port,
    reverseProxyPort,
  )}`;
}
