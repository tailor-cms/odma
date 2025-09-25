# Installation Guide

## Setting Up Your Development Machine

### Introduction

This guide is designed to help you prepare your development machine for 
development. You have two primary options for setting up the necessary 
dependencies:

- **Using Docker:** Dependencies are managed through Docker compose, 
  simplifying the setup process.
- **Manual Setup:** This approach requires manually installing and configuring
  the necessary services.

### General Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js (version 22.x or higher)](https://nodejs.org/en/download/)
- [pnpm (version 10.17.1 or higher)](https://pnpm.io/installation)
- Clone the repository to your local machine.

### Setup Using Docker

1. Install [Docker](https://docs.docker.com/engine/install/).
2. Start the required services with Docker Compose:

```sh 
docker compose -f docker-compose.dev.yaml up -d
```

3. Initialize the development environment:

```sh 
pnpm setup:dev
```

4. Launch the backend and frontend applications in development mode:

```sh 
pnpm dev
```

### Manual Setup (Native Prerequisite Services)

1. Install and configure 
   [PostgreSQL (version 9.4 or higher)](https://www.postgresql.org/download/).
2. Initialize the development environment:

```sh 
pnpm setup:dev
```

3. Launch the backend and frontend applications in development mode:

```sh 
pnpm dev
```

## Running the Application in Production Mode

1. The application's configuration is managed through environment variables 
   in a `.env` file. Start by copying the `.env.example` file to `.env` and 
   entering your configuration details:

```sh 
cp .env.example .env
```

2. Build the application:

```sh 
pnpm build
```

3. Migrate the database:

```sh 
pnpm db:migrate
```

4. Start the application:

```sh 
pnpm start
```

## Environment Configuration

The development environment setup script (`setup:dev`) automatically configures 
default  environment variables and populates the `.env` file in the project 
root. For a complete list of configuration options, refer to the `.env.example`
file. Use this file as a template to create your `.env` file and customize the
configuration details as necessary.
