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
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AnonymousGuard } from '../auth/guards/anonymous.guard';
import { Post as PostModel } from '@prisma/client';
import { ExtendedPost } from './interfaces/post.interface';

@ApiTags('posts')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseGuards(AnonymousGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post (supports anonymous posting)' })
  @ApiResponse({
    status: 201,
    description: 'The post has been successfully created.',
  })
  create(
    @Request() req,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostModel> {
    return this.postService.create(req.user.id, createPostDto);
  }

  @Get()
  @UseGuards(AnonymousGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all posts of a board' })
  @ApiQuery({
    name: 'boardId',
    required: false,
    description: 'Filter posts by board ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all posts.',
  })
  findAll(
    @Request() req,
    @Query('boardId') boardId?: string,
  ): Promise<ExtendedPost[]> {
    return this.postService.findAll(boardId, req.user?.id);
  }

  @Get(':id')
  @UseGuards(AnonymousGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a post by id' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the post.',
  })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  findOne(@Param('id') id: string): Promise<PostModel> {
    return this.postService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AnonymousGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post (supports anonymous posting)' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'The post has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req,
  ): Promise<PostModel> {
    return this.postService.update(id, req.user.id, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(AnonymousGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a post (supports anonymous posting)' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'The post has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  remove(@Param('id') id: string, @Request() req): Promise<PostModel> {
    return this.postService.remove(id, req.user.id);
  }

  @Post(':id/upvote')
  @UseGuards(AnonymousGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upvote a post (supports anonymous posting)' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'The post has been successfully upvoted or un-upvoted.',
  })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  upvote(@Param('id') id: string, @Request() req): Promise<ExtendedPost> {
    return this.postService.upvote(id, req.user.id);
  }

  @Get('by-slug/:slug')
  @UseGuards(AnonymousGuard)
  @ApiOperation({ summary: 'Get a post by slug' })
    @ApiParam({ name: 'slug', description: 'Post slug' })
    @ApiResponse({
    status: 200,
    description:
      'Return the post with comments, board information, and optional upvote status.',
  })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  findBySlug(
    @Param('slug') slug: string,
    @Request() req,
  ): Promise<ExtendedPost> {
    return this.postService.findBySlug(slug, req.user?.id);
  }
}
