import {IsNumber, IsString, IsNotEmpty, Min} from 'class-validator';

export class DepositDto {
  @IsNumber()
  @Min(1)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  cliqAlias!: string;
}
