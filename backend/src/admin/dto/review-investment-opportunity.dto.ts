import {IsIn, IsNotEmpty, IsOptional, IsString} from 'class-validator';

export class ReviewInvestmentOpportunityDto {
  @IsIn(['approve', 'reject', 'publish', 'unpublish'])
  action!: 'approve' | 'reject' | 'publish' | 'unpublish';

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  notes?: string;
}
