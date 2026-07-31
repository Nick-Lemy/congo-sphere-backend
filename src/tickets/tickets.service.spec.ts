import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { FilesService } from '../files/files.service';

describe.skip('TicketsService', () => {
  let service: TicketsService;
  const mockFilesService = {
    uploadImage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
