import {IsNotEmpty, IsOptional, IsString, MaxLength} from 'class-validator';

export class CreateThreadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject!: string;

  @IsOptional()
  @IsString()
  listingId?: string;

  @IsOptional()
  @IsString()
  opportunityId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  initialMessage!: string;
}
