import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventUsersService } from '../event-users/event-users.service';
import { FilesService } from '../files/files.service';
import { EmailsService } from '../emails/emails.service';
import { TicketsService } from '../tickets/tickets.service';
import { UserService } from '../user/user.service';
import { PaymentService } from '../payment/payment.service';

describe.skip('EventsService', () => {
  let service: EventsService;
  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockEventUsersService = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockPaymentService = {
    processTicketPayment: jest.fn(),
    checkDepositStatus: jest.fn(),
  };

  const mockFilesService = {
    uploadImage: jest.fn(),
  };

  const mockEmailsService = {
    sendEventRegistrationEmail: jest.fn(),
  };

  const mockTicketsService = {
    createEventPdfTicket: jest.fn(),
  };

  const mockUserService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventUsersService,
          useValue: mockEventUsersService,
        },
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
        {
          provide: EmailsService,
          useValue: mockEmailsService,
        },
        {
          provide: TicketsService,
          useValue: mockTicketsService,
        },
        { provide: UserService, useValue: mockUserService },
        { provide: PaymentService, useValue: mockPaymentService },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
