import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { type JwtPayload } from '../common/types/jtw.type';
import { AdminGuard } from '../auth/admin.guard';
import {
  FilterMyTicketsDto,
  FilterTicketsDto,
} from './dto/filters-tickets.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @ApiOperation({
    summary: 'Get all tickets by userId and eventId',
    description: 'Returns a list of all tickets',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tickets retrieved successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @Get('')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  findAll(@Query() filters: FilterTicketsDto) {
    return this.ticketsService.getTickets(filters.userId, filters.eventId);
  }

  @ApiOperation({
    summary: 'Get all tickets by userId and eventId',
    description: 'Returns a list of all tickets',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tickets retrieved successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @Get('my-tickets')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  findMyTickets(
    @CurrentUser() user: JwtPayload,
    @Query() filters: FilterMyTicketsDto,
  ) {
    return this.ticketsService.getTickets(user.sub, filters.eventId);
  }

  @ApiOperation({
    summary: 'Get a ticket by ID',
    description: 'Returns a ticket by its ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ticketsService.getTicketById(user.sub, id);
  }
}
