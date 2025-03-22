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
import { PostStatus } from '@prisma/client';

export class CreatePostDto {
  @ApiProperty({
    description: 'The title of the post',
    example: 'Add dark mode support',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9\s\-_.,!?'"()]+$/, {
    message:
      'Title can only contain letters, numbers, spaces, and basic punctuation',
  })
  title: string;

  @ApiProperty({
    description: 'The description of the post',
    example: 'Implement dark mode theme across all pages',
    required: false,
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  @Matches(/^[a-zA-Z0-9\s\-_.,!?'"()[\]{}#@$%&*+=/\\:;<>]*$/, {
    message:
      'Description can only contain letters, numbers, spaces, and common symbols',
  })
  description?: string;

  @ApiProperty({
    description: 'The status of the post',
    enum: PostStatus,
    default: PostStatus.NEW,
    required: false,
  })
  @IsEnum(PostStatus)
  @IsOptional()
  status?: PostStatus;

  @ApiProperty({
    description: 'The ID of the board this post belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, {
    message: 'Invalid board ID format',
  })
  boardId: string;
}
