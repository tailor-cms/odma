export function expectUser(user: any, expectations: Partial<any> = {}) {
  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('email');
  expect(user).toHaveProperty('firstName');
  expect(user).toHaveProperty('lastName');
  expect(user).toHaveProperty('role');
  expect(user).toHaveProperty('createdAt');
  expect(user).toHaveProperty('updatedAt');
  expect(user).not.toHaveProperty('password');
  Object.entries(expectations).forEach(([key, value]) => {
    expect(user[key]).toBe(value);
  });
}

export function expectPaginatedResponse(
  response: any,
  expectations: Partial<any> = {},
) {
  expect(response).toHaveProperty('data');
  expect(response).toHaveProperty('total');
  expect(response).toHaveProperty('page');
  expect(response).toHaveProperty('limit');
  expect(response).toHaveProperty('totalPages');
  expect(response).toHaveProperty('hasNext');
  expect(response).toHaveProperty('hasPrevious');
  Object.entries(expectations).forEach(([key, value]) => {
    expect(response[key]).toBe(value);
  });
}

export function expectValidationError(response: any, field?: string) {
  expect(response.body).toHaveProperty('message');
  expect(response.body).toHaveProperty('error', 'Bad Request');
  expect(response.body).toHaveProperty('statusCode', 400);
  if (field) {
    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining(field)]),
    );
  }
}

export function expectForbidden(response: any) {
  expect(response.body).toHaveProperty('statusCode', 403);
  if (response.body.message) {
    // Message may vary based on implementation
    expect(typeof response.body.message).toBe('string');
  }
}

export function expectNotFound(response: any) {
  expect(response.body).toHaveProperty('statusCode', 404);
  expect(response.body.message).toContain('not found');
}

export function expectConflict(response: any, message?: string) {
  expect(response.body).toHaveProperty('statusCode', 409);
  if (message) {
    expect(response.body.message).toContain(message);
  }
}

export function expectBadRequest(response: any, message?: string) {
  expect(response.body).toHaveProperty('statusCode', 400);
  if (message) {
    expect(response.body.message).toContain(message);
  }
}
