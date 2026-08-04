import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { type JwtPayload } from '../common/types/jtw.type';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateEventDto } from './dto/update-event.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @ApiOperation({
    summary: 'Get all events',
    description: 'Returns a list of all events',
  })
  @ApiResponse({
    status: 200,
    description: 'List of events retrieved successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @Get('')
  findAll() {
    return this.eventsService.findAll();
  }

  @ApiOperation({
    summary: 'Create a new event',
    description: 'Creates a new event with the provided details',
  })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.eventsService.create(user, createEventDto, file);
  }

  @ApiOperation({
    summary: 'Get one event',
    description: "Get a single event's information form the event's id",
  })
  @ApiResponse({
    status: 200,
    description: 'Event got successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update an event',
    description: 'Update a single event by id',
  })
  @ApiResponse({
    status: 200,
    description: 'Content updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.eventsService.update(id, updateEventDto, user, file);
  }

  @ApiOperation({
    summary: 'Register to an event',
    description: 'Register to a single event by id',
  })
  @ApiResponse({
    status: 200,
    description: 'Event registered successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found!',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post(':id/register')
  registerToEvent(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Query('ticketTypeId') ticketTypeId: string,
  ) {
    return this.eventsService.registerToEvent(id, user, ticketTypeId);
  }

  @ApiOperation({
    summary: 'Cancel event registration',
    description: 'Unregisters the current user from the event',
  })
  @ApiResponse({ status: 204, description: 'Successfully unregistered' })
  @ApiResponse({ status: 404, description: 'Event or registration not found' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete(':id/register')
  cancelRegistration(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.eventsService.cancelRegistration(id, user);
  }

  @ApiOperation({
    summary: 'Delete an event',
    description: 'Delete a single event by id',
  })
  @ApiResponse({
    status: 204,
    description: 'Event deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found!',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.eventsService.delete(id, user);
  }

  @ApiOperation({
    summary: 'Find Event Host',
    description: 'Get event host by event id',
  })
  @ApiResponse({
    status: 200,
    description: 'Host Found!',
  })
  @ApiResponse({
    status: 404,
    description: 'Host or Event not found!',
  })
  @Get(':id/host')
  findhost(@Param('id') id: string) {
    return this.eventsService.findHost(id);
  }

  @ApiOperation({
    summary: 'Find Attendees of event',
    description: 'Get all attendees of an event by the eventId',
  })
  @ApiResponse({
    status: 200,
    description: 'List of attendees retrieved succesfully!',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found!',
  })
  @Get(':id/attendees')
  findAllAttendees(@Param('id') id: string) {
    return this.eventsService.findAllAttendees(id);
  }

  @ApiOperation({
    summary: 'Find my events',
    description: 'Get all events created by the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of events retrieved succesfully!',
  })
  @ApiResponse({
    status: 404,
    description: 'Host or Event not found!',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('/my-events')
  findMyEvents(@CurrentUser() user: JwtPayload) {
    return this.eventsService.findEventsByHostId(user.sub);
  }
}
