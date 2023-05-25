import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
  @IsString()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  nickname: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9]*$/, {
    message: 'password only accepts alphabetical characters and numbers',
  })
  password: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9]*$/, {
    message: 'password only accepts alphabetical characters and numbers',
  })
  confirm: string;

  @IsString()
  @Matches(/^[0-9-]*$/, {
    message: 'phone number can contain only numbers and a hyphen',
  })
  phoneNumber: string;
}

export class LoginDto {
  @IsString()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9]*$/, {
    message: 'password only accepts alphabetical characters and numbers',
  })
  password: string;
}
