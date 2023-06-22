import { IsNotEmpty } from 'class-validator';

export class StoresSearchDto {
  @IsNotEmpty()
  storeName: string;
  category: string;
  maxWaitingCnt: number;
  lat: number;
  lon: number;
  newAddress: string;
  oldAddress: string;
  tableForTwo: number;
  tableForFour: number;
}
