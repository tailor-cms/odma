import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Public } from '@/modules/auth/decorators';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly em: EntityManager) {}

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
      await this.em.execute('SELECT 1');
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
}
