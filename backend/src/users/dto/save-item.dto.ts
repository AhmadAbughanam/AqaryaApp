import {IsIn, IsOptional, IsString} from 'class-validator';
import {SavedItemType} from '@prisma/client';

export class SaveItemDto {
  @IsIn(['listing', 'opportunity'])
  type!: SavedItemType;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  opportunityId?: string;
}
