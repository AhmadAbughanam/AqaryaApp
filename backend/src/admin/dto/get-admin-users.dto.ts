import {IsIn, IsOptional} from 'class-validator';

export class GetAdminUsersDto {
  @IsOptional()
  @IsIn(['individual', 'owner', 'agency', 'developer', 'partner'])
  accountType?: string;

  @IsOptional()
  @IsIn(['unverified', 'under_review', 'verified', 'rejected', 'suspended'])
  providerStatus?: string;
}
