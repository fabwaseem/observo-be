import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BoardTheme } from '@prisma/client';

export class CreateBoardDto {
  @ApiProperty({
    description: 'The name of the board',
    example: 'My Project Board',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, {
    message:
      'Board name can only contain letters, numbers, spaces, hyphens, and underscores',
  })
  name: string;

  @ApiProperty({
    description: 'The theme of the board',
    enum: BoardTheme,
    default: BoardTheme.LIGHT,
    example: BoardTheme.LIGHT,
  })
  @IsEnum(BoardTheme)
  @IsOptional()
  theme?: BoardTheme;
}
