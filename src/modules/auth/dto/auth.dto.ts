import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Request } from 'express';

export class AuthResponseDTO {
  @ApiProperty()
  walletAddress: string;

  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  removeSession: boolean;
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

  @ApiProperty({ required: false })
  walletAddress?: string;

  request?: Request;
}
