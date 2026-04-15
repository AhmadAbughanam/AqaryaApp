import {IsNotEmpty, IsString, MinLength} from 'class-validator';

export class RequestChangesPropertyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  notes!: string;
}
