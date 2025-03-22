import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { BoardTheme } from '@prisma/client';

export class CreateBoardDto {
  @ApiProperty({
    description: 'The name of the board',
    example: 'My Project Board',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The theme of the board',
    enum: BoardTheme,
    default: BoardTheme.LIGHT,
    example: BoardTheme.LIGHT,
  })
  @IsEnum(BoardTheme)
  theme?: BoardTheme;
}
