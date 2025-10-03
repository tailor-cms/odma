<div align="center">
  <img src="apps/frontend/public/img/default-logo-full.svg" alt="Odma" width="120">
  <h1>Odma</h1>
  <p><strong>Production-ready full-stack application starter with enterprise-grade tooling</strong></p>
  
  [![CI](https://github.com/tailor-cms/odma/workflows/PR%20checks/badge.svg)](https://github.com/tailor-cms/odma/actions)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
</div>

---

## 🚀 Overview

**Odma** is a comprehensive full-stack application template built with modern technologies and enterprise-grade practices. It provides a solid foundation for building scalable web applications with authentication, user management, and production deployment capabilities.

### **🏗️ Architecture**

- **Backend**: NestJS + TypeScript + PostgreSQL + MikroORM
- **Frontend**: Nuxt 3 + Vue 3 + Vuetify 3 + Pinia
- **Testing**: Playwright E2E + Jest API + Visual + A11y
- **Infrastructure**: Docker + AWS + Pulumi IaC
- **Monorepo**: PNPM workspaces with shared packages

### **✨ Key Features**

- 🔐 **Authentication System**: JWT + OIDC (Google, etc.) support
- 👥 **User Management**: Admin panel with role-based access control
- 📧 **Email System**: Template-based emails with Handlebars
- 🛡️ **Security First**: Input validation, XSS prevention, secure headers
- 🧪 **Comprehensive Testing**: E2E, API, visual regression, accessibility
- 🚀 **Production Ready**: Docker, CI/CD, monitoring, logging
- 📱 **Responsive UI**: Material Design 3 with Vuetify
- 🔧 **Developer Experience**: Hot reload, TypeScript, ESLint, automated setup

---

## 🏃‍♂️ Quick Start

### Prerequisites

- **Node.js** 22.x or higher
- **PNPM** 10.17.1 or higher
- **PostgreSQL** 14+ (or use Docker Compose)
- **Git**

### 1. Clone & Setup

```bash
git clone https://github.com/tailor-cms/odma.git
cd odma

# Interactive setup (creates .env, sets up database, etc.)
pnpm setup:dev
```

### 2. Start Development

```bash
# Start both backend and frontend with hot reload
pnpm dev
```

🎉 **That's it!** Your app is now running:
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api
- **API Docs**: http://localhost:3000/api/docs

### 3. Login

Default admin user (created during setup):
- **Email**: admin@example.com
- **Password**: (set during interactive setup)

---

## 📂 Project Structure

```
odma/
├── apps/
│   ├── backend/           # NestJS API server
│   └── frontend/          # Nuxt 3 SPA client
├── packages/              # Shared libraries
│   ├── app-config/        # Environment & URL utilities
│   ├── app-interfaces/    # TypeScript interfaces
│   ├── app-vue-components/# Reusable Vue components
│   └── app-seed/          # Database seeding data
├── tests/                 # E2E Playwright tests
├── scripts/               # Development automation
├── infrastructure/        # Pulumi IaC for AWS
├── docs/                  # VitePress documentation
└── .github/workflows/     # CI/CD pipelines
```

---

## 🛠️ Development Commands

```bash
# Development
pnpm dev                   # Start backend + frontend
pnpm dc                    # Start with Docker Compose + dev servers

# Building
pnpm build                 # Build all apps and packages
pnpm start                 # Start production server

# Database
pnpm seed                  # Seed database with test data
pnpm db:migrate            # Run database migrations
pnpm db:reset              # Reset database schema

# Testing
pnpm e2e:functional        # Run functional E2E tests
pnpm e2e:visual            # Run visual regression tests
pnpm e2e:a11y              # Run accessibility tests
pnpm lint                  # Run ESLint

# Documentation
pnpm docs:dev              # Start documentation server
pnpm docs:build            # Build documentation
```

---

## 🏢 Backend (NestJS)

**Location**: `apps/backend/`

### **Core Technologies**
- **NestJS** 11.1.6 with TypeScript
- **MikroORM** 6.5.6 with PostgreSQL
- **Passport.js** (JWT + Local strategies)
- **Pino** structured logging
- **Jest** with comprehensive E2E tests

### **Key Modules**
- **Auth**: JWT authentication, login/logout, password reset
- **User**: CRUD operations, profile management, admin controls
- **Mail**: Email templates with Handlebars
- **Health**: Monitoring endpoints

### **Security Features**
- Global JWT authentication guard
- Role-based access control (ADMIN/USER)
- Input validation with class-validator
- Helmet.js security headers
- Rate limiting with Throttler
- XSS protection and password hashing

[📖 **Backend Documentation**](apps/backend/README.md)

---

## 🎨 Frontend (Nuxt 3)

**Location**: `apps/frontend/`

### **Core Technologies**
- **Nuxt 3** 4.1.2 with Vue 3.5.22
- **Vuetify 3** 3.10.3 (Material Design 3)
- **Pinia** for state management
- **VeeValidate** + Yup for forms
- **Axios** with interceptors

### **Key Features**
- **Authentication**: Local login + OIDC support
- **Admin Panel**: User management interface
- **Responsive Design**: Material Design 3 theming
- **Form Validation**: Client-side validation with Yup
- **Notifications**: Event bus-based system

### **Architecture**
- SPA mode with API proxy
- File-based routing
- Layout system (main/auth)
- Middleware for auth guards
- Plugin system for services

---

## 🧪 Testing Strategy

**Location**: `tests/`

### **Testing Types**
- **Functional**: User flows and feature testing
- **Visual**: Screenshot comparison with Percy
- **Accessibility**: axe-core compliance testing
- **API**: Backend Jest E2E test suite

### **Tools & Framework**
- **Playwright** 1.55.1 for E2E automation
- **Percy** for visual regression
- **Axe** for accessibility validation
- **Mailtrap** for email testing

### **Test Organization**
```
tests/
├── specs/
│   ├── functional/        # User workflow tests
│   ├── visual/           # Visual regression tests
│   └── a11y/             # Accessibility tests
├── pom/                  # Page Object Models
├── api/                  # API client utilities
└── fixtures/             # Test data and assets
```

---

## 🚀 Deployment & Infrastructure

### **Docker**
- **Multi-stage builds** with Node.js Alpine
- **Production optimized** with PNPM caching
- **Environment-based** configuration

### **CI/CD Pipeline**
- **GitHub Actions** for automated testing
- **Docker image** building and publishing to GHCR
- **Pulumi deployment** to AWS infrastructure
- **Documentation** deployment to GitHub Pages

### **Infrastructure as Code**
**Location**: `infrastructure/`

- **Pulumi** TypeScript for AWS provisioning
- **Automated deployment** via GitHub Actions
- **Environment-specific** configurations

### **Production Features**
- Health check endpoints for load balancers
- Structured logging with Pino
- Error monitoring and handling
- Security headers and CORS configuration
- Rate limiting and throttling

---

## 📦 Shared Packages

### **@app/config**
Environment configuration and URL utilities
- Localhost detection
- URL parsing and validation
- Environment-based settings

### **@app/interfaces**
TypeScript type definitions shared across applications
- User interfaces and enums
- API request/response types
- Common data structures

### **@app/vue-components**
Reusable Vue.js components library
- UI components (dialogs, avatars, etc.)
- Form utilities and validation
- SCSS mixins and styles

### **@app/seed**
Database seeding utilities and test data
- User fixtures and factories
- Development data sets
- Test environment setup

---

## 🔧 Configuration

### **Environment Variables**
The application uses environment-based configuration with validation.

**Key Configuration Areas**:
- Database connection and pooling
- JWT secrets and authentication
- SMTP email settings
- OIDC provider configuration
- CORS and security settings
- Logging levels and formats

### **Setup Process**
Run `pnpm setup:dev` for interactive configuration that will:
1. Create environment files
2. Set up database connection
3. Configure admin user
4. Install dependencies
5. Run initial migrations

---

## 📚 Documentation

**Location**: `docs/` | **Framework**: VitePress

### **Available Documentation**
- [🚀 **Setup Guide**](docs/dev/general/setup.md)
- [🧪 **Testing Guide**](docs/dev/general/testing.md)
- [🚀 **Deployment Guide**](docs/dev/general/deployment.md)

### **Documentation Features**
- **VitePress** powered documentation
- **GitHub Pages** deployment
- **Automated builds** via GitHub Actions
- **Searchable content** with full-text search

---

## 🤝 Contributing

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run the full test suite
5. Submit a pull request

### **Code Standards**
- **ESLint** with Nuxt configuration
- **TypeScript** strict mode
- **90%+ test coverage** requirement
- **Conventional commits** for clarity

### **Pull Request Process**
- Automated CI checks (linting, testing)
- Code review requirements
- Documentation updates if needed
- Security review for sensitive changes

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- 📖 **Documentation**: [View Docs](https://your-org.github.io/app-starter)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-org/app-starter/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-org/app-starter/discussions)

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/tailor-cms">Tailor CMS</a></p>
  <p>⭐ <strong>Star this repository if it helped you!</strong></p>
</div>
