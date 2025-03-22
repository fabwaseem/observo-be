import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AnonymousGuard } from '../auth/guards/anonymous.guard';
import { Comment } from '@prisma/client';

@ApiTags('comments')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AnonymousGuard)
  @ApiOperation({
    summary: 'Create a new comment (supports anonymous commenting)',
  })
  @ApiResponse({
    status: 201,
    description: 'The comment has been successfully created.',
  })
  create(
    @Request() req,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    return this.commentService.create(req.user.id, createCommentDto);
  }

  @Get()
  @UseGuards(AnonymousGuard)
  @ApiOperation({ summary: 'Get all comments for a post' })
  @ApiQuery({
    name: 'postId',
    required: true,
    description: 'Get comments for this post ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all comments for the post.',
  })
  findAll(@Query('postId') postId: string): Promise<Comment[]> {
    return this.commentService.findAll(postId);
  }

  @Get(':id')
  @UseGuards(AnonymousGuard)
  @ApiOperation({ summary: 'Get a comment by id' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the comment.',
  })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  findOne(@Param('id') id: string): Promise<Comment> {
    return this.commentService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AnonymousGuard)
  @ApiOperation({ summary: 'Update a comment (supports anonymous commenting)' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({
    status: 200,
    description: 'The comment has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req,
  ): Promise<Comment> {
    return this.commentService.update(id, req.user.id, updateCommentDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AnonymousGuard)
  @ApiOperation({ summary: 'Delete a comment (supports anonymous commenting)' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({
    status: 200,
    description: 'The comment has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  remove(@Param('id') id: string, @Request() req): Promise<Comment> {
    return this.commentService.remove(id, req.user.id);
  }
}
