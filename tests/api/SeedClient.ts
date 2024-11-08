import type { EndpointResponse } from './common';
import { formatResponse } from './common';
import BaseClient from './BaseClient';

class SeedClient extends BaseClient {
  constructor() {
    super('/api/seed/');
  }

  resetDatabase = async (): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.post(this.getUrl('reset'));
    return formatResponse(res);
  };

  seedUser = async (): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.post(this.getUrl('user'));
    return formatResponse(res);
  };
}

export default new SeedClient();
