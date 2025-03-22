import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { Board } from '@prisma/client';
import { generateSlug } from 'src/shared/helpers/auth.helpers';

@Injectable()
export class BoardService {
  constructor(private prisma: PrismaService) {}

  async create(
    walletAddress: string,
    createBoardDto: CreateBoardDto,
  ): Promise<Board> {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      throw new NotFoundException(
        `User with wallet address ${walletAddress} not found`,
      );
    }

    let slug = generateSlug(createBoardDto.name);

    let existingBoard = await this.prisma.board.findUnique({
      where: { slug },
    });
    let counter = 1;
    while (existingBoard) {
      slug = `${slug}-${counter}`;
      existingBoard = await this.prisma.board.findUnique({
        where: { slug },
      });
      counter++;
    }

    return this.prisma.board.create({
      data: {
        ...createBoardDto,
        userId: user.id,
        slug,
      },
    });
  }

  async findAll(walletAddress: string): Promise<Board[]> {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      throw new NotFoundException(
        `User with wallet address ${walletAddress} not found`,
      );
    }

    return this.prisma.board.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<Board> {
    const board = await this.prisma.board.findUnique({
      where: { id },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }

    return board;
  }

  async update(
    id: string,
    walletAddress: string,
    updateBoardDto: UpdateBoardDto,
  ): Promise<Board> {
    // Check if board exists and user has access
    await this.findOne(id);

    return this.prisma.board.update({
      where: { id },
      data: updateBoardDto,
    });
  }

  async remove(id: string, walletAddress: string): Promise<Board> {
    // Check if board exists and user has access
    await this.findOne(id);

    return this.prisma.board.delete({
      where: { id },
    });
  }

  async findBySlug(slug: string): Promise<Board> {
    const board = await this.prisma.board.findUnique({
      where: { slug },
      include: {
        User: {
          select: {
            walletAddress: true,
            name: true,
            avatar: true,
          },
        },
        Post: {
          include: {
            User: {
              select: {
                walletAddress: true,
                name: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                Comment: true,
                upvotedBy: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException(`Board with slug ${slug} not found`);
    }

    return board;
  }
}
