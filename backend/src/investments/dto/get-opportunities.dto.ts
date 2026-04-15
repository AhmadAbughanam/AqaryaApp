import {Type} from 'class-transformer';
import {IsIn, IsInt, IsOptional, IsString, Max, Min} from 'class-validator';

export class GetOpportunitiesDto {
  @IsOptional()
  @IsString()
  assetClass?: string;

  @IsOptional()
  @IsString()
  riskBand?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['conservative', 'balanced', 'growth', 'aggressive'])
  trustTier?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
