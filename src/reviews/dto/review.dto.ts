import { IsNotEmpty, IsString, IsInt, Min, Max } from 'class-validator';

export class ReviewDto {
  @IsString()
  @IsNotEmpty()
  review: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(5)
  rating: number;
}
