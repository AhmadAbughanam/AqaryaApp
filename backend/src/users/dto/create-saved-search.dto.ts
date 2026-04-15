import {IsIn, IsNotEmpty, IsObject, IsString, MaxLength} from 'class-validator';

export class CreateSavedSearchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsIn(['sale', 'rent', 'investment'])
  searchType!: 'sale' | 'rent' | 'investment';

  @IsObject()
  filters!: Record<string, unknown>;
}
