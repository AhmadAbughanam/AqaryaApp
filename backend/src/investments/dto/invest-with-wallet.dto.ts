import {IsInt, IsNumber, IsString, IsBoolean, IsOptional, Min} from 'class-validator';

export class InvestWithWalletDto {
  @IsInt()
  @Min(1)
  shares!: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  holdingPeriodYears?: number;

  @IsString()
  @IsOptional()
  exitScenario?: 'conservative' | 'base' | 'optimistic';

  @IsBoolean()
  @IsOptional()
  reinvestDistributions?: boolean;
}
