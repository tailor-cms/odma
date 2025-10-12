import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { Public } from '@/modules/auth/decorators';
import * as Sentry from '@sentry/nestjs';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    private readonly em: EntityManager,
    private readonly config: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @Public()
  @Get('healthcheck')
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  @Public()
  @Get('health/live')
  liveness() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }

  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  @Public()
  @Get('health/ready')
  async readiness() {
    try {
      // Use a database-agnostic way to check connection
      await this.em.getConnection().execute('SELECT 1');
      return {
        status: 'ready',
        services: { database: 'connected' },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'not ready',
        services: { database: 'disconnected' },
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown db error',
      });
    }
  }

  @ApiOperation({ summary: 'Test Sentry error capture (development only)' })
  @ApiResponse({ status: 500, description: 'Test error thrown for Sentry' })
  @Public()
  @Get('sentry/debug')
  sentryDebug() {
    const isProduction = this.config.get<boolean>('isProduction', false);
    if (isProduction) {
      return { error: 'Debug endpoint disabled in production' };
    }
    // Test Sentry error capture
    throw new Error('Test error for Sentry integration verification');
  }

  @ApiOperation({ summary: 'Test Sentry message capture (development only)' })
  @ApiResponse({ status: 200, description: 'Test message sent to Sentry' })
  @Public()
  @Get('sentry/message')
  sentryMessage() {
    const isProduction = this.config.get<boolean>('isProduction', false);
    if (isProduction) {
      return { error: 'Debug endpoint disabled in production' };
    }
    Sentry.captureMessage('Test message from NestJS health endpoint', 'info');
    return {
      status: 'Message sent to Sentry',
      timestamp: new Date().toISOString()
    };
  }
}
