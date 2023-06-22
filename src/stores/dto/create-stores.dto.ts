import { IsNotEmpty } from 'class-validator';

//임시
export class CreateStoresDto {
  @IsNotEmpty()
  storeName: string;

  @IsNotEmpty()
  category: string;

  @IsNotEmpty()
  newAddress: string;

  @IsNotEmpty()
  maxWaitingCnt: number;

  @IsNotEmpty()
  lon: number;

  @IsNotEmpty()
  lat: number;

  @IsNotEmpty()
  tableForTwo: number;

  @IsNotEmpty()
  tableForFour: number;
}
