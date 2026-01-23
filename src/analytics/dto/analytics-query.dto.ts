import { IsOptional, IsEnum } from 'class-validator';

export enum TimeRange {
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
  NINETY_DAYS = '90d',
}

export enum MetricGroup {
  LEADS = 'LEADS',
  CONVERSIONS = 'CONVERSIONS',
  FOLLOWUPS = 'FOLLOWUPS',
  FEEDBACK = 'FEEDBACK',
}

export enum BreakdownType {
  CHANNEL = 'CHANNEL',
  TEMPERATURE = 'TEMPERATURE',
  RATING = 'RATING',
}

export class AnalyticsQueryDto {
  @IsOptional()
  @IsEnum(TimeRange)
  range?: TimeRange;

  @IsOptional()
  @IsEnum(MetricGroup)
  metric?: MetricGroup;
}

export class BreakdownQueryDto {
  @IsEnum(BreakdownType)
  type!: BreakdownType;
}
