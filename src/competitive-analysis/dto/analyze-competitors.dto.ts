import { IsString, IsOptional, IsLatitude, IsLongitude, IsNumber, Min, Max, IsEnum } from 'class-validator';

export enum AnalysisDepth {
  QUICK = 'QUICK',       // Basic competitor identification
  STANDARD = 'STANDARD', // Full SEO analysis
  DEEP = 'DEEP',         // Comprehensive analysis with recommendations
}

export class AnalyzeCompetitorsDto {
  @IsString()
  businessNiche!: string; // e.g., "restaurant", "hotel", "spa"

  @IsString()
  @IsOptional()
  businessName?: string; // Client's business name

  @IsString()
  @IsOptional()
  location?: string; // e.g., "San Jose, Costa Rica"

  @IsLatitude()
  @IsOptional()
  latitude?: number;

  @IsLongitude()
  @IsOptional()
  longitude?: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  radiusKm?: number; // For local business analysis (default: 10km)

  @IsEnum(AnalysisDepth)
  @IsOptional()
  depth?: AnalysisDepth; // Default: STANDARD

  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  maxCompetitors?: number; // Default: 10
}
