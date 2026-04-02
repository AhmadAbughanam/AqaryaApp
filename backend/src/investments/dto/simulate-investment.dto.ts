import {Type} from 'class-transformer';
import {IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min} from 'class-validator';

export class SimulateInvestmentDto {
  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  shares!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  holdingPeriodYears?: number;

  @IsOptional()
  @IsIn(['conservative', 'base', 'optimistic'])
  exitScenario?: 'conservative' | 'base' | 'optimistic';

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  reinvestDistributions?: boolean;
}
