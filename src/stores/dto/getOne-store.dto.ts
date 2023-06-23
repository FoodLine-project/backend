import { IsNotEmpty } from 'class-validator';
import { Reviews } from 'src/reviews/reviews.entity';

export class oneStoreDto {
  @IsNotEmpty()
  storeName: string;
  category: string;
  maxWaitingCnt: number;
  currentWaitingCnt: number;
  lon: number;
  lat: number;
  newAddress: string;
  tableForTwo: number;
  tableForFour: number;
  rating: number;
}
