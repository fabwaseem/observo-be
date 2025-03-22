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
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Board } from '@prisma/client';

@ApiTags('boards')
@ApiBearerAuth()
@Controller('boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a new board' })
  @ApiResponse({
    status: 201,
    description: 'The board has been successfully created.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(
    @Request() req,
    @Body() createBoardDto: CreateBoardDto,
  ): Promise<Board> {
    return this.boardService.create(req.user.walletAddress, createBoardDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all boards for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Return all boards for the authenticated user.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@Request() req): Promise<Board[]> {
    return this.boardService.findAll(req.user.walletAddress);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a board by id' })
  @ApiParam({ name: 'id', description: 'Board ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the board.',
  })
  @ApiResponse({ status: 404, description: 'Board not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findOne(@Param('id') id: string, @Request() req): Promise<Board> {
    return this.boardService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update a board' })
  @ApiParam({ name: 'id', description: 'Board ID' })
  @ApiResponse({
    status: 200,
    description: 'The board has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Board not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  update(
    @Param('id') id: string,
    @Body() updateBoardDto: UpdateBoardDto,
    @Request() req,
  ): Promise<Board> {
    return this.boardService.update(id, req.user.walletAddress, updateBoardDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete a board' })
  @ApiParam({ name: 'id', description: 'Board ID' })
  @ApiResponse({
    status: 200,
    description: 'The board has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Board not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  remove(@Param('id') id: string, @Request() req): Promise<Board> {
    return this.boardService.remove(id, req.user.walletAddress);
  }

  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Get a board by slug' })
  @ApiParam({ name: 'slug', description: 'Board slug' })
  @ApiResponse({
    status: 200,
    description: 'Return the board and its posts.',
  })
  @ApiResponse({ status: 404, description: 'Board not found.' })
  findBySlug(@Param('slug') slug: string): Promise<Board> {
    return this.boardService.findBySlug(slug);
  }
}
