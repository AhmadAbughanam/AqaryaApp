import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSaleListingDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sourcePropertyId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsString()
  @IsNotEmpty()
  ownerName!: string;

  @IsString()
  @IsNotEmpty()
  ownershipType!: string;

  @IsString()
  @IsNotEmpty()
  ownershipProofType!: string;

  @IsString()
  @IsNotEmpty()
  ownershipProofNumber!: string;

  @IsString()
  @MinLength(20)
  description!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({each: true})
  imageUrls?: string[];

  @IsNumber()
  @Min(1)
  price!: number;

  @IsNumber()
  @Min(1)
  propertyValue!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalShares!: number;
}
