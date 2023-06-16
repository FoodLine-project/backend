import { IsNotEmpty } from 'class-validator';

//임시
export class CreateStoresDto {
  @IsNotEmpty()
  storeName: string;

  @IsNotEmpty()
  category: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  maxWaitingCnt: number;

  @IsNotEmpty()
  currentWaitingCnt: number;

  @IsNotEmpty()
  Ma: number;

  @IsNotEmpty()
  La: number;

  @IsNotEmpty()
  tableForTwo: number;

  @IsNotEmpty()
  tableForFour: number;
}
