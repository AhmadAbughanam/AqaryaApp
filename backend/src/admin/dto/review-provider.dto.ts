import {IsIn, IsOptional, IsString} from 'class-validator';

export class ReviewProviderDto {
  @IsIn(['under_review', 'verify', 'reject', 'suspend', 'update_notes'])
  action!: 'under_review' | 'verify' | 'reject' | 'suspend' | 'update_notes';

  @IsOptional()
  @IsString()
  notes?: string;
}
