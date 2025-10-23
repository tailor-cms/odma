# Backend API

Production-ready NestJS application with authentication, user management,
and security-first design.

## 🚀 Architecture Overview

This backend is a well-structured NestJS application built with enterprise-grade security and scalability in mind.

### **Core Framework & Technologies**
- **NestJS** v11.1.6 with TypeScript
- **MikroORM** v6.5.6 with PostgreSQL driver
- **Passport.js** for authentication (JWT + Local strategies)
- **Pino** for structured logging
- **Jest** for testing with comprehensive e2e test suite

### **Key Modules**
- **Auth Module** (`src/modules/auth/`): JWT authentication, login/logout, password reset
- **User Module** (`src/modules/user/`): User CRUD operations, profile management
- **Mail Module** (`src/modules/mail/`): Email templates and sending (with Handlebars)
- **Health Module** (`src/modules/health/`): Health check endpoints

### **Security Features**
- Global JWT authentication guard
- Role-based access control (ADMIN/USER roles)
- Input validation with class-validator
- Helmet.js for security headers
- Rate limiting with Throttler
- XSS protection validators
- Password hashing with bcrypt

### **Database & ORM**
- PostgreSQL with MikroORM
- User entity with roles, soft delete capability
- Migration and seeding system
- Custom repository pattern

### **Development Features**
- Swagger API documentation
- Hot reload development mode
- Comprehensive e2e test suite
- TypeScript path mapping
- Pino pretty logging for development

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
