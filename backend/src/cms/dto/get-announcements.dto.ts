import {IsEnum, IsNumber, IsOptional, Min} from 'class-validator';
import {Transform} from 'class-transformer';
import {AnnouncementStatus} from '@prisma/client';

export class GetAnnouncementsDto {
  @IsOptional()
  @Transform(({value}: {value: string}) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({value}: {value: string}) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsEnum(['active', 'archived'])
  status?: AnnouncementStatus;
}
