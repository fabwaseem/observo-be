import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDTO {
  walletAddress: string;
  accessToken: string;
}

export class AuthUserDTO {
  @IsOptional() // Allow `undefined` values
  @IsString()
  @ApiProperty({ required: false })
  signature?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  signedMessage?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  accessToken?: string;
}