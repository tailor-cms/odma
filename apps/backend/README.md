# Backend API

Production-ready NestJS application with authentication, user management,
and security-first design.

## 🚀 Architecture Overview

### Core Modules

- **Auth**: JWT authentication, role-based access, password reset, user invitations
- **User**: Complete user management with search, filtering, soft deletion, admin controls
- **Mail**: Template-based emails with Handlebars (password reset, invitations)
- **Health**: Production monitoring endpoints for load balancers

### Security Features

- Global JWT protection with role-based access control (Admin/User)
- XSS prevention, input validation, secure cookie handling
- Comprehensive logging with sensitive data masking
- Production-ready exception handling and monitoring

### Technology Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with MikroORM (migrations, seeding, repository pattern)
- **Authentication**: JWT with secure HTTP-only cookies
- **Email**: Nodemailer with Handlebars templating
- **Logging**: Structured logging with Pino
- **API Docs**: Swagger/OpenAPI integration
- **Testing**: Comprehensive E2E test suite with security testing

## 🛠️ Quick Start

### 1. Setup Environment

```bash
# Install dependencies
pnpm install

# Configure environment (see ../../.env.example for all options)
cp ../../.env.example ../../.env
```

### 2. Database Setup

```bash
# Create schema and run migrations
pnpm schema:create
pnpm migration:up

# Seed initial data (creates admin user)
pnpm seeder:run
```

### 3. Start Development

```bash
pnpm dev
```

API available at `http://localhost:3000/api` • Docs at `/api/docs`

## 🧪 Testing

Comprehensive E2E test suite covering authentication, authorization, security,
and data integrity.

```bash
# Setup test environment (uses in-memory SQLite)
cp test.env.example .env.test

# Run tests
pnpm test:e2e          # All E2E tests
pnpm test:e2e:cov      # With coverage
pnpm test:e2e:watch    # Watch mode
```

**Coverage**: Authentication (95%+), User Management (100%), Security (100%), 
API Validation (95%+)

See [test/README.md](./test/README.md) for detailed testing documentation.

## 📝 Development Scripts

```bash
# Development
pnpm dev              # Start with hot reload
pnpm start:debug      # Start with debugger

# Database
pnpm migration:create # Create migration
pnpm migration:up     # Run migrations
pnpm schema:fresh     # Reset database
pnpm seeder:run       # Seed data

pnpm build            # Production build
```

## 🔧 Configuration

Environment-based configuration with Joi validation.
See `../../.env.example` for all available options.

**Key Configuration Areas**:

- Database connection and pooling
- JWT secrets and cookie security
- SMTP email settings
- CORS and security headers
- Logging levels and formats

## 📚 API Overview

### Authentication Endpoints

```
POST /api/auth/login           # Login with email/password
GET  /api/auth/logout          # Logout (clears cookies)
POST /api/auth/forgot-password # Request password reset
POST /api/auth/reset-password  # Reset with token
POST /api/auth/change-password # Change password (authenticated)
```

### User Management (Admin Only)

```
GET    /api/users              # List with search/pagination
POST   /api/users              # Create user
GET    /api/users/:id          # Get user details
PATCH  /api/users/:id          # Update user
DELETE /api/users/:id          # Soft delete
POST   /api/users/:id/restore  # Restore deleted user
```

### Profile Management

```
GET   /api/me                  # Current user profile
PATCH /api/me                  # Update profile (restricted fields)
```

### System

```
GET /api/health                # Health check for monitoring
```

## 🚀 Production Deployment

### Build & Environment

```bash
pnpm build                     # Creates dist/ folder
```

**Required Environment**: Strong JWT secrets, secure database connection,
SMTP configuration, appropriate log levels.

**Production Features**: Health checks, structured logging, Swagger docs,
rate limiting, security headers, error handling.

## 🤝 Contributing

1. Create feature branch with comprehensive tests
2. Run full test suite: `pnpm test:e2e`
3. Lint code: `pnpm lint`
4. Ensure 90%+ test coverage
5. Follow TypeScript strict mode and NestJS patterns
