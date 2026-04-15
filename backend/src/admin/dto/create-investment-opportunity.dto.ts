import {Type} from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateInvestmentOpportunityDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsArray()
  @IsString({each: true})
  imageUrls?: string[];

  @IsString()
  @IsNotEmpty()
  assetClass!: string;

  @IsString()
  @IsNotEmpty()
  stage!: string;

  @IsString()
  @IsNotEmpty()
  sponsorName!: string;

  @IsString()
  @IsNotEmpty()
  ownershipStructure!: string;

  @IsString()
  @IsNotEmpty()
  distributionModel!: string;

  @IsString()
  @IsNotEmpty()
  exitModel!: string;

  @Type(() => Number)
  @IsInt()
  @Min(100)
  totalShares!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pricePerShare!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  minimumShares!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  targetIrr!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  targetCashYield!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  targetHoldYears!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  appreciationRate!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  occupancyRate!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  managementFeeRate!: number;

  @IsIn(['Conservative', 'Balanced', 'Growth', 'Aggressive'])
  riskBand!: string;
}
