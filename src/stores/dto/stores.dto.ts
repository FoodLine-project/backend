import { IsNotEmpty } from 'class-validator';

export class CreateStoreDto {
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

export class storeDto {
  storeId?: number;
  storeName: string;
  category: string;
  newAddress: string;
  oldAddress?: string;
  maxWaitingCnt?: number;
  currentWaitingCnt?: number;
  lat?: number;
  lon?: number;
  distance?: string;
  tableForTwo: number;
  tableForFour: number;
  rating?: number;
  cycleTime?: number;
}
