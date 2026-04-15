import {IsEnum, IsOptional, IsString, MaxLength, MinLength} from 'class-validator';
import {AnnouncementAudience, NotificationType} from '@prisma/client';

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  body!: string;

  @IsEnum(['listing_status_change', 'investment_milestone', 'new_message', 'saved_search_match', 'system', 'provider_status_change', 'report_update'])
  type!: NotificationType;

  @IsEnum(['all_citizens', 'all_providers', 'one_user'])
  audience!: AnnouncementAudience;

  @IsOptional()
  @IsString()
  targetUserId?: string;
}
