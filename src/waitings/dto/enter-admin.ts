import { IsNotEmpty } from 'class-validator';

export class DirectEnterDto {
  @IsNotEmpty()
  peopleCnt: number;
  @IsNotEmpty()
  userId: number;
}
