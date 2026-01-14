import { Test, TestingModule } from '@nestjs/testing';
import { InboxesService } from './inboxes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('InboxesService', () => {
  let service: InboxesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InboxesService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get(InboxesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
