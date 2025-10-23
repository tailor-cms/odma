# Odma

<div align="center">
  <img src="apps/frontend/public/img/default-logo-animated.svg" alt="Odma Logo" width="120" height="120">
  
  **Full-Stack Application Template**
  
  *Get productive right away with auth, user management, and API-first architecture*
  
  > **Odma** means "right away" in Dalmatian

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.1.6-red)](https://nestjs.com/)
[![Nuxt](https://img.shields.io/badge/Nuxt-4.1.2-green)](https://nuxt.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)

</div>

---

## What This Is

Odma is a full-stack application starter that includes all the foundational 
components most modern applications need. Rather than starting from scratch,
you get a working system that demonstrates best practices for building scalable
web applications with proper architecture, security, testing, and deployment
infrastructure.

The user management module serves as a practical showcase of how all the pieces
work together - from database design and API endpoints to frontend interfaces
and testing strategies.

### What You Get

- **Basic Auth System** - Local login/signup, JWT sessions, role-based access
- **User Management Example** - Full CRUD operations, user invitations, role management
- **API-First Architecture** - OpenAPI specification with auto-generated typed client
- **Production Security** - Input validation, rate limiting, secure headers, audit logging
- **Comprehensive Testing** - Backend API tests, E2E browser testing, visual regression, a11y
- **Monitoring & Observability** - Sentry error tracking, performance profiling, structured logging
- **Infrastructure as Code** - Docker containers, AWS deployment scripts, health monitoring
- **Development Tools** - Hot reload, type safety, automated API client generation, one-command setup

---

## Technology Stack

### Backend (`/apps/backend`)

- **[NestJS](https://nestjs.com/)** - Node.js framework with dependency injection, decorators, and module system
- **[PostgreSQL](https://www.postgresql.org/)** - Primary database with full ACID compliance
- **[MikroORM](https://mikro-orm.io/)** - TypeScript ORM handling migrations, entities, and query building
- **[Passport.js](https://www.passportjs.org/)** - Authentication strategies for JWT tokens and local credentials
- **[Pino](https://getpino.io/)** - JSON logging with request correlation IDs
- **[Swagger/OpenAPI](https://swagger.io/)** - API specification generation from TypeScript decorators
- **[Sentry](https://sentry.io/)** - Exception tracking, performance profiling, and alerting

### Frontend (`/apps/frontend`)

- **[Nuxt](https://nuxt.com/)** - Vue.js meta-framework running in SPA mode
- **[Vue](https://vuejs.org/)** - Component framework with Composition API
- **[Vuetify](https://vuetifyjs.com/)** - Material Design component library with theming
- **[Pinia](https://pinia.vuejs.org/)** - Client-side state management with TypeScript support
- **[VeeValidate](https://vee-validate.logaretm.com/)** - Form validation integrated with Yup schemas
- **[Axios](https://axios-http.com/)** - HTTP client with request/response interceptors

### Testing (`/tests`)

- **[Playwright](https://playwright.dev/)** - Browser automation for user workflow testing
- **[Jest](https://jestjs.io/)** - Backend API integration testing with database cleanup
- **[Percy](https://percy.io/)** - Visual diff testing for UI regression detection
- **[axe-core](https://github.com/dequelabs/axe-core)** - Automated a11y compliance checking

### Infrastructure

- **[Docker](https://www.docker.com/)** - Containerization with multi-stage builds for optimized images
- **[Pulumi](https://www.pulumi.com/)** - TypeScript-based infrastructure provisioning for AWS

### Tooling

- **[PNPM](https://pnpm.io/)** - Package manager with workspace support and efficient storage
- **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io/)** - Code linting and formatting

---

## Getting Started

### Prerequisites

- Node.js 18+ and PNPM 8+
- Docker and Docker Compose
- PostgreSQL 16+ (or use Docker)

### Automated Setup

```bash
git clone <repository-url>
cd odma
pnpm setup:dev
```

This script will:

- Install all dependencies across workspaces
- Generate environment configuration
- Start required services (PostgreSQL, Redis)
- Run database migrations and seeding
- Launch development servers

### Manual Setup

```bash
# Install dependencies
pnpm i

# Configure environment
cp .env.example .env
# Edit .env with your database credentials and API keys

# Start services
docker-compose -f docker-compose.dev.yaml up -d

# Setup database
pnpm --filter backend migration:up
pnpm --filter backend seeder:run

# Start development
pnpm dev
```

### Access Points

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Database**: postgresql://dev:dev@localhost:5432/odma

---

## Authentication & Security

### Authentication Methods

- **Local Auth** - Email/password with JWT tokens
- **Session Management** - HTTP-only cookies with CSRF protection

### Security Features

- **Role-Based Access Control** - ADMIN and USER roles with guards
- **Input Validation** - Global validation pipes with class-validator
- **Rate Limiting** - 100 requests per minute throttling
- **XSS Protection** - Input sanitization and secure headers
- **CORS Configuration**

### Default Users (Development)

```
Admin: admin@example.com / admin123!
```

---

## API-First Development

### OpenAPI Specification

The backend automatically generates OpenAPI specifications from NestJS decorators, providing:

- **Live Documentation** at `/api/docs` with Swagger UI
- **Type-safe API contracts** from TypeScript DTOs
- **Request/response validation** at runtime

### Custom API Client Generator

One of the key innovations is the custom-built API client generator (`packages/api-client-generator`) that:

- **Reads OpenAPI specs** from the backend and generates TypeScript clients
- **Creates typed methods** for every API endpoint with full parameter types
- **Provides both standard and raw responses** for flexibility
- **Watches for changes** in development for automatic regeneration
- **Generates TypeScript interfaces** for all DTOs and responses

```typescript
// Auto-generated typed client with full IntelliSense
import { createApiClient } from 'app-api-client';

const api = await createApiClient({ axiosClient });

// Typed method calls with parameter validation
const user = await api.auth.login({
  body: { email: 'user@example.com', password: 'password123' },
});

// Access raw Axios responses when needed
const response = await api.auth.login.raw({ body: credentials });

// Automatic error handling with typed errors
try {
  await api.user.update({ path: { id: '123' }, body: updateData });
} catch (error) {
  console.log(error.code, error.details); // Typed error properties
}
```

### API Client Generation

```bash
# Generate API client from OpenAPI spec
pnpm api:client:generate

# Watch mode for development
pnpm api:client:watch
```

---

## Testing

This project uses a multi-layered testing approach that validates functionality from the database layer up through complete user workflows in browsers.

### Testing Architecture

The testing system is designed around two main areas:

1. **Backend integration testing** (`/apps/backend/test`) - Tests the API endpoints, business logic, and database interactions
2. **E2E testing** (`/tests`) - Tests complete user workflows through browser automation

### Backend Integration Testing (Jest)

```bash
# Integration tests with database
pnpm --filter backend test:e2e

# Watch mode during development
pnpm --filter backend test:watch

# Coverage report
pnpm --filter backend test:cov
```

**Test coverage includes:**

- **Authentication API** - Login, JWT validation, password reset flows
- **User management** - CRUD operations, role assignments, soft deletion
- **Access control** - Role-based permissions and admin-only endpoints
- **Data validation** - Input sanitization and database constraints
- **Email workflows** - Password reset and invitation email sending

**Test patterns:**

- Each test gets a fresh database instance
- Test fixtures provide reusable authentication and user data
- API requests are made using supertest with cookie session handling
- Database state is validated alongside API responses

### Frontend E2E Testing (Playwright)

Browser tests validate complete user workflows across multiple browsers:

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm test:e2e tests/specs/file.ts
```

**Test coverage includes:**

- **Authentication flows** - Login, logout, forgot password workflows
- **Users domain** - User management, role changes, user invitations

### Visual & Accessibility Testing

Additional test layers ensure UI consistency and compliance:

```bash
# Visual regression testing
pnpm test:visual

# Accessibility compliance
pnpm test:a11y
```

**Visual testing:**

- Screenshots are captured during E2E tests
- Percy compares against baseline images
- Flags visual regressions across browsers and viewports

**Accessibility testing:**

- axe-core runs automated compliance checks
- Tests against WCAG 2.1 guidelines
- Validates keyboard navigation and screen reader support

### Test Infrastructure

**Database management:**

- Each backend test gets an isolated database
- Migrations run automatically before tests
- Database cleanup happens after each test suite

**Email testing:**

- Mailtrap catches all outbound emails during testing
- Email content and delivery are validated in tests
- No actual emails are sent during test runs

### CI/CD Integration

The test infrastructure supports:

- **Parallel job execution** for faster CI runs
- **Database services** in GitHub Actions
- **Cross-browser testing** with Playwright
- **Test artifacts** and reporting

---

## Docker & Containerization

### Development Services

```bash
# Start all development services
docker-compose -f docker-compose.dev.yaml up

# Services included:
# - PostgreSQL 16 (port 5432)
# - Redis 7.4 (port 6379)
```

## Infrastructure & Deployment

### AWS Infrastructure with Pulumi

```bash
cd infrastructure

# Configure AWS credentials
aws configure

# Deploy infrastructure
pulumi up

# Outputs: VPC, RDS, Load Balancer, ECS Services
```

### Infrastructure Components

- **🌐 VPC** - Isolated network with public/private subnets
- **🗄️ RDS PostgreSQL** - Managed database with backups
- **⚖️ Application Load Balancer** - SSL termination and routing
- **🚀 ECS Fargate** - Serverless container deployment
- **🔒 Security Groups** - Network-level security

### Environment Management

- **🏠 Development** - Local Docker services
- **🚀 Staging/Production** - AWS ECS with RDS
- **🔧 Configuration** - Environment-specific variables
- **🗝️ Secrets** - AWS Systems Manager Parameter Store

---

## Monitoring & Observability

### Sentry Integration

- **🐛 Error Tracking** - Real-time exception monitoring
- **📈 Performance Monitoring** - Request duration and database query tracking
- **🔍 Profiling** - CPU profiling for performance bottlenecks
- **🚨 Alerting** - Email and Slack notifications

### Health Monitoring

- **❤️ Health Checks** - `/api/health/live` and `/api/health/ready`
- **📊 Metrics** - Application and infrastructure metrics
- **🔍 Request Tracing** - Correlation IDs for debugging

---

## Documentation

### VitePress Documentation Site

```bash
# Start documentation server
pnpm docs:dev

# Build documentation
pnpm docs:build
```

---

## Project Structure

```
odma/
├── 📱 apps/
│   ├── backend/          # NestJS API server
│   └── frontend/         # Nuxt 3 SPA client
├── 📦 packages/          # Shared libraries
│   ├── api-client-generator/  # Custom OpenAPI client generator
│   ├── app-api-client/   # Generated API client
│   ├── app-config/       # Environment configuration
│   ├── app-interfaces/   # Shared TypeScript types
│   ├── app-vue-components/  # Reusable Vue components
│   └── app-seed/         # Database seeding utilities
├── 🧪 tests/             # Playwright E2E tests
├── 🏗️ infrastructure/    # Pulumi AWS infrastructure
├── 📚 docs/              # VitePress documentation
├── 🛠️ scripts/           # Development automation
└── 🐳 docker-compose.*.yaml  # Development services
```

---

### Development Features

- **🔥 Hot Reload** - Backend and frontend auto-restart
- **🔍 Type Safety** - End-to-end TypeScript
- **📝 Auto-completion** - Full IntelliSense support
- **🚫 Pre-commit Hooks** - Automated code quality checks
- **📊 Bundle Analysis** - Frontend build optimization

---

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

---

## Troubleshooting

### Common Issues

**Port already in use:**

```bash
# Kill process on port 3000 or 3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

**Database connection errors:**

```bash
# Ensure PostgreSQL is running
docker-compose -f docker-compose.dev.yaml up -d

# Reset database if corrupted
pnpm --filter backend schema:drop
pnpm --filter backend migration:up
pnpm --filter backend seeder:run
```

**API client out of sync:**

```bash
# Regenerate API client after backend changes
pnpm api:client:generate

# Or run in watch mode during development
pnpm api:client:watch
```

**TypeScript errors after dependency updates:**

```bash
# Clear all caches and reinstall
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Sentry not working:**

- Check that `SENTRY_DSN` is set in your `.env` file
- Verify the DSN is valid from your Sentry project settings
- In development, check logs for "Sentry instrumentation initialized"

**Email not sending:**

- Verify Mailtrap credentials in `.env`
- Check `MAIL_HOST`, `MAIL_USER`, and `MAIL_PASSWORD` are correct
- For production, configure your SMTP provider

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

Built with ❤️ using modern open-source technologies:

- [NestJS](https://nestjs.com/) for the robust backend framework
- [Nuxt](https://nuxt.com/) for the powerful frontend framework
- [Vuetify](https://vuetifyjs.com/) for the beautiful Material Design components
- [Playwright](https://playwright.dev/) for reliable end-to-end testing

---

<div align="center">
  <p><strong>Happy coding! 🚀</strong></p>
  <p>
    <a href="#quick-start">Get Started</a> •
    <a href="docs/">Documentation</a> •
    <a href="/apps/backend/README.md">Backend Guide</a> •
    <a href="/apps/frontend/README.md">Frontend Guide</a>
  </p>
</div>
