import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterTicketsDto {
  @ApiPropertyOptional()
  eventId?: string;
  @ApiPropertyOptional()
  userId?: string;
}

export class FilterMyTicketsDto {
  @ApiPropertyOptional()
  eventId?: string;
}
