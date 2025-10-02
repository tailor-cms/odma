import type { INestApplication } from '@nestjs/common';
import type { TestUser } from './test.helpers';
import request from 'supertest';

export interface RequestOptions {
  path?: string;
  body?: any;
  query?: any;
  set?: Record<string, string>;
}

export class ApiRequest {
  constructor(
    private readonly app: INestApplication,
    private readonly baseRoute: string,
  ) {}

  as(user: TestUser | null) {
    return {
      get: (opts?: RequestOptions) => this.request('get', user, opts),
      post: (opts?: RequestOptions) => this.request('post', user, opts),
      patch: (opts?: RequestOptions) => this.request('patch', user, opts),
      delete: (opts?: RequestOptions) => this.request('delete', user, opts),
      put: (opts?: RequestOptions) => this.request('put', user, opts),
    };
  }

  private request(
    method: 'get' | 'post' | 'patch' | 'delete' | 'put',
    user: TestUser | null,
    options: RequestOptions = {},
  ) {
    const { path = '', body, query, set = {} } = options;
    const apiRoute = `${this.baseRoute}${path}`;
    let req = request(this.app.getHttpServer())[method](apiRoute);
    if (user?.token) req = req.set('Authorization', `Bearer ${user.token}`);
    if (query) req = req.query(query);
    if (body) req = req.send(body);

    Object.entries(set).forEach(([key, value]) => {
      req = req.set(key, value);
    });
    return req;
  }
}
