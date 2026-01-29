import { Test, TestingModule } from '@nestjs/testing';
import { CompetitiveAnalysisController } from './competitive-analysis.controller';

describe('CompetitiveAnalysisController', () => {
  let controller: CompetitiveAnalysisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompetitiveAnalysisController],
    }).compile();

    controller = module.get<CompetitiveAnalysisController>(CompetitiveAnalysisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
