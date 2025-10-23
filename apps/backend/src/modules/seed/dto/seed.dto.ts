import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SeedResponseDto {
  @ApiProperty({ description: 'Result message' })
  message: string;

  @ApiPropertyOptional({ description: 'Response data' })
  data?: any;
}
