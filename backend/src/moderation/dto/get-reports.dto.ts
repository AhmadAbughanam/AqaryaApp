import {IsEnum, IsInt, IsOptional, Max, Min} from 'class-validator';
import {Transform} from 'class-transformer';
import {ReportStatus, ReportTargetType, ReportReason} from '@prisma/client';

export class GetReportsDto {
  @IsOptional()
  @IsEnum(ReportTargetType)
  targetType?: ReportTargetType;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsEnum(ReportReason)
  reason?: ReportReason;

  @IsOptional()
  @Transform(({value}: {value: unknown}) => parseInt(String(value), 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({value}: {value: unknown}) => parseInt(String(value), 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
