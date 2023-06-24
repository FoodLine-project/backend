import { IsNotEmpty } from 'class-validator';

export class searchRestaurantsDto {
  @IsNotEmpty()
  storeName: string;
  rating: number;
  category: string;
  newAddress: string;
  currentWaitingCnt: number;
  distance: number;
  tableForTwo: number;
  tableForFour: number;
}
