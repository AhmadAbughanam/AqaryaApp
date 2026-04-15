import {Type} from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

const allowedActionTypes = [
  'login',
  'listing_submitted',
  'listing_verified',
  'listing_rejected',
  'listing_frozen',
  'listing_changes_requested',
  'anchor',
  'simulate',
  'opportunity_submitted',
  'opportunity_approved',
  'opportunity_rejected',
  'opportunity_published',
  'opportunity_unpublished',
  'opportunity_simulate',
  'thread_created',
  'message_sent',
];

export class GetAuditLogsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsIn(allowedActionTypes)
  actionType?:
    | 'login'
    | 'listing_submitted'
    | 'listing_verified'
    | 'listing_rejected'
    | 'listing_frozen'
    | 'listing_changes_requested'
    | 'anchor'
    | 'simulate'
    | 'opportunity_submitted'
    | 'opportunity_approved'
    | 'opportunity_rejected'
    | 'opportunity_published'
    | 'opportunity_unpublished'
    | 'opportunity_simulate'
    | 'thread_created'
    | 'message_sent';

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
