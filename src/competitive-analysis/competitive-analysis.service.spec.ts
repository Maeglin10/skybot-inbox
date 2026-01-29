import { Test, TestingModule } from '@nestjs/testing';
import { CompetitiveAnalysisService } from './competitive-analysis.service';

describe('CompetitiveAnalysisService', () => {
  let service: CompetitiveAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompetitiveAnalysisService],
    }).compile();

    service = module.get<CompetitiveAnalysisService>(
      CompetitiveAnalysisService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
