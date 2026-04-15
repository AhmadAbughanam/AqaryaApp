import {IsEnum, IsOptional, IsString, MaxLength} from 'class-validator';

export type ModerateAction = 'mark_under_review' | 'resolve' | 'dismiss';

export class ModerateReportDto {
  @IsEnum(['mark_under_review', 'resolve', 'dismiss'])
  action!: ModerateAction;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
