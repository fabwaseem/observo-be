import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: 'The content of the comment',
    example: 'Great idea! Looking forward to this feature.',
    minLength: 1,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  @Matches(/^[a-zA-Z0-9\s\-_.,!?'"()[\]{}#@$%&*+=/\\:;<>]+$/, {
    message:
      'Comment can only contain letters, numbers, spaces, and common symbols',
  })
  content: string;

  @ApiProperty({
    description: 'The ID of the post this comment belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, {
    message: 'Invalid post ID format',
  })
  postId: string;
}
