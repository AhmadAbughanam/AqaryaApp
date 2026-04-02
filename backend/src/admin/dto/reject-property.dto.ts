import {IsNotEmpty, IsString, MinLength} from 'class-validator';

export class RejectPropertyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason!: string;
}
