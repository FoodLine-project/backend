import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, {
    message: '이메일 형식이 올바르지 않습니다.',
  })
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(4, { message: `닉네임의 최소 길이는 4자입니다.` })
  @MaxLength(16, { message: `닉네임의 최대 길이는 16자입니다.` })
  nickname: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: `비밀번호의 최소 길이는 8자입니다.` })
  @MaxLength(20, { message: `비밀번호의 최대 길이는 20자입니다.` })
  password: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  confirm: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^010-\d{4}-\d{4}$/, {
    message: '전화번호의 형식은 010-1234-5678과 같아야합니다.',
  })
  phoneNumber: string;

  isAdmin?: boolean;

  StoreId?: number;
}

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
