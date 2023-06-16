import { IsNotEmpty } from 'class-validator';

export class StoresSearchDto {
  @IsNotEmpty()
  storeName: string;
  category: string;
  description: string;
  maxWaitingCnt: number;
  currentWaitingCnt: number;
  Ma: number;
  La: number;
  address: string;
  tableForTwo: number;
  tableForFour: number;
}
