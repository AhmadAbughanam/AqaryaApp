import {IsBoolean, IsIn, IsOptional} from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @IsOptional()
  @IsIn(['en', 'ar'])
  language?: string;
}
