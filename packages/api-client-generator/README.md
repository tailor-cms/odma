# API Client Generator

A TypeScript-first API client generator that creates axios-based clients from 
OpenAPI specifications. Built specifically for NestJS backends with automatic
type inference and response handling.

## Purpose

This generator creates fully-typed, axios-based API clients that:
- **Auto-generate from OpenAPI specs** - No manual API client maintenance
- **Preserve full type safety** - Request/response types inferred from your DTOs
- **Handle response formats** - Works with NestJS `SuccessResponse<T>` wrappers
- **Support multiple patterns** - Both data extraction and raw response access
- **Enable hot-reloading** - Watch OpenAPI changes and regenerate instantly

## Core Principles

### 1. **Type Safety First**

All request and response types are automatically inferred from your OpenAPI
specification, eliminating manual type definitions and ensuring consistency
with your backend.

### 2. **Response Format Awareness**

Understands NestJS response patterns like `SuccessResponse<UserDto>` and
automatically extracts the data while preserving error handling.

### 3. **Dual Access Patterns**

- **Data extraction**: `api.users.getUser()` returns the unwrapped data
- **Raw access**: `api.users.getUser.raw()` returns the full axios response

### 4. **Namespace Organization**

Groups methods by OpenAPI operation IDs
(e.g., `users_getUser` → `api.users.getUser`)

### 5. **Zero Configuration**

Works out-of-the-box with monorepo structure detection and sensible defaults.

## Usage

### Generate API Client

```bash
# Generate from auto-detected OpenAPI spec
pnpm api:client:build

# Generate from specific spec file
pnpm api:client:build --spec ./custom-spec.json

# Generate to custom output directory
pnpm api:client:build --output ./my-api-client

# Watch for changes and auto-regenerate
pnpm api:client:watch
```

### Using the Generated Client

```typescript
import { createApiClient } from 'app-api-client';
import axiosClient from './request'; // Your configured axios instance

// Create the API client
const api = await createApiClient({ axiosClient });

// Now use the fully-typed client
const userData = await api.auth.login({
  body: { email: 'user@example.com', password: 'password123' },
});
```

## Examples

### Authentication

```typescript
// Login
const loginResult = await api.auth.login({
  body: {
    email: 'user@example.com',
    password: 'password123',
  },
});
// Type: SuccessResponse<{ user: UserDto; authData: AuthDataDto }>
console.log(loginResult.user.id, loginResult.authData.token);

// Register
const newUser = await api.auth.register({
  body: {
    email: 'newuser@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
  },
});
// Type: SuccessResponse<UserDto>

// Logout
await api.auth.logout();

// Get current user
const currentUser = await api.auth.me();
// Type: SuccessResponse<UserDto>
```

### User CRUD Operations

```typescript
// Get all users (with pagination)
const users = await api.users.getUsers({
  query: {
    page: 1,
    limit: 10,
    search: 'john',
  },
});
// Type: SuccessResponse<{ users: UserDto[]; pagination: PaginationDto }>

// Get specific user
const user = await api.users.getUser({
  path: { id: '123e4567-e89b-12d3-a456-426614174000' },
});
// Type: SuccessResponse<UserDto>

// Create user
const newUser = await api.users.createUser({
  body: {
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
  },
});
// Type: SuccessResponse<UserDto>

// Update user
const updatedUser = await api.users.updateUser({
  path: { id: user.id },
  body: {
    firstName: 'Updated Name',
    lastName: 'Updated Last',
  },
});
// Type: SuccessResponse<UserDto>

// Delete user
await api.users.deleteUser({
  path: { id: user.id },
});
// Type: SuccessResponse<void>
```

### Raw Response Access

When you need access to status codes, headers, or full response data:

```typescript
// Get raw axios response
const rawResponse = await api.users.getUser.raw({
  path: { id: '123' },
});

console.log(rawResponse.status); // 200
console.log(rawResponse.headers); // Full headers object
console.log(rawResponse.data); // Raw response body

// Handle different status codes
if (rawResponse.status === 200) {
  const userData = rawResponse.data.data; // Extract from SuccessResponse
}
```

### Error Handling

```typescript
try {
  const user = await api.users.getUser({
    path: { id: 'invalid-id' },
  });
} catch (error) {
  // Error automatically includes structured error details
  console.log(error.message); // Human-readable message
  console.log(error.code); // Error code from backend
  console.log(error.type); // Error type
  console.log(error.details); // Additional error details
  console.log(error.meta); // Response metadata
}
```

### Advanced Query Parameters

```typescript
// Complex filtering and sorting
const filteredUsers = await api.users.getUsers({
  query: {
    page: 2,
    limit: 25,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    filters: {
      role: 'admin',
      isActive: true,
      createdAfter: '2024-01-01',
    },
  },
});
```

## Response Data Extraction

The client automatically extracts data from NestJS response wrappers:

```typescript
// Backend returns: { success: true, data: UserDto, meta: { timestamp: ... } }
const user = await api.users.getUser({ path: { id: '123' } });
// user is typed as UserDto (data extracted automatically)

// To access the full response structure:
const fullResponse = await api.users.getUser.raw({ path: { id: '123' } });
// fullResponse.data contains the complete { success, data, meta } object
```

## Configuration

### CLI Options

```bash
# Specify custom OpenAPI spec location
--spec, -s <path>     Path to OpenAPI spec file (default: auto-detected)

# Specify custom output directory
--output, -o <path>   Output directory (default: packages/app-api-client)

# Enable verbose logging
--verbose, -v         Show detailed generation logs

# Show help
--help, -h           Display help information
```

### Monorepo Integration

The generator automatically detects your monorepo structure:

- **Root detection**: Finds monorepo root using `package.json`
- **Spec location**: Auto-locates OpenAPI spec from backend
- **Output path**: Defaults to `packages/app-api-client`

## Generated Files

```
packages/app-api-client/
├── index.mjs          # Main client code
├── index.d.ts         # TypeScript definitions
└── spec.openapi.json  # OpenAPI spec copy
```

## Type Safety Features

### Request Types

All request parameters are typed based on your OpenAPI spec:

- **Path parameters**: `{ path: { id: string } }`
- **Query parameters**: `{ query: { page?: number; limit?: number } }`
- **Request body**: `{ body: CreateUserDto }`

### Response Types

Response types are automatically inferred from your DTOs:

- **Success responses**: Typed as your DTO (e.g., `UserDto`)
- **Error responses**: Structured error objects with message, code, type
- **Pagination**: Automatic pagination metadata typing

### Namespace Safety

Methods are organized into namespaces based on your controller structure:

- `api.auth.*` - Authentication endpoints
- `api.users.*` - User management endpoints

## Development Workflow

1. **Modify your NestJS controllers/DTOs**
2. **OpenAPI spec updates automatically** (in dev mode)
3. **API client regenerates automatically** (in dev mode)
4. **Frontend gets new types immediately** - no manual updates needed

## Advanced Usage

### Custom Axios Configuration

```typescript
import axios from 'axios';
import { createApiClient } from 'app-api-client';

// Configure axios with interceptors, auth, etc.
const axiosClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Add auth interceptor
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Create API client with configured axios
const api = await createApiClient({ axiosClient });
```

### Response Interceptors

```typescript
// Handle common response patterns
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
```

## Troubleshooting

### Common Issues

**Client not updating after backend changes:**

- Ensure OpenAPI spec is regenerated: `pnpm openapi:generate`
- Regenerate client: `pnpm api:client:build`

**Type errors in IDE:**

- Restart TypeScript service in your editor
- Check that `app-api-client` is properly imported

**Build failures:**

- Ensure backend is built first: `cd apps/backend && pnpm build`
- Check OpenAPI spec is valid JSON

### Debug Mode

```bash
# Enable verbose logging to see detailed generation process
pnpm api:client:build --verbose
```

## Architecture

The generator follows a modular architecture:

- **OpenAPI Parser**: Extracts operations and types from spec
- **Code Generator**: Creates axios-based client methods
- **Type Generator**: Generates TypeScript definitions
- **Template System**: Uses common-tags for clean code generation
- **Config System**: Centralized configuration with PascalCase properties
- **Root Finder**: Automatic monorepo structure detection

## Contributing

The generator is part of your monorepo. To modify or extend:

1. **Core logic**: `packages/api-client-generator/src/lib/`
2. **Templates**: `packages/api-client-generator/src/lib/template-helpers.js`
3. **CLI**: `packages/api-client-generator/bin/`

All changes should maintain TypeScript compatibility and follow the existing
code patterns.
