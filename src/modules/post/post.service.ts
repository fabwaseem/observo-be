import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post, User } from '@prisma/client';
import { generateSlug } from 'src/shared/helpers/auth.helpers';
import { ExtendedPost } from './interfaces/post.interface';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async create(
    walletAddress: string,
    createPostDto: CreatePostDto,
  ): Promise<Post> {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      throw new NotFoundException(
        `User with wallet address ${walletAddress} not found`,
      );
    }

    // Only check if board exists, no need to check ownership
    const board = await this.prisma.board.findUnique({
      where: { id: createPostDto.boardId },
    });

    if (!board) {
      throw new NotFoundException(
        `Board with ID ${createPostDto.boardId} not found`,
      );
    }

    let slug = generateSlug(createPostDto.title);

    let existingPost = await this.prisma.post.findUnique({
      where: { slug },
    });

    let counter = 1;
    while (existingPost) {
      slug = `${slug}-${counter}`;
      existingPost = await this.prisma.post.findUnique({
        where: { slug },
      });
      counter++;
    }

    return this.prisma.post.create({
      data: {
        ...createPostDto,
        userId: user.id,
        slug,
      },
      include: {
        User: {
          select: {
            walletAddress: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  async findAll(
    boardId?: string,
    walletAddress?: string,
  ): Promise<ExtendedPost[]> {
    let userId: string | undefined;
    console.log(walletAddress);
    if (walletAddress) {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });
      userId = user?.id;
    }

    const where = boardId ? { boardId } : {};

    const posts = await this.prisma.post.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        User: {
          select: {
            walletAddress: true,
            name: true,
            avatar: true,
          },
        },
        upvotedBy: userId
          ? {
              where: {
                id: userId,
              },
            }
          : false,
        _count: {
          select: {
            Comment: true,
            upvotedBy: true,
          },
        },
      },
    });

    return posts.map((post) => ({
      ...post,
      isUpvoted: userId ? post.upvotedBy.length > 0 : false,
      upvotedBy: undefined,
    }));
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            walletAddress: true,
            name: true,
            avatar: true,
          },
        },
        Comment: {
          include: {
            user: {
              select: {
                walletAddress: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            Comment: true,
            upvotedBy: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async update(
    id: string,
    walletAddress: string,
    updatePostDto: UpdatePostDto,
  ): Promise<Post> {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      throw new NotFoundException(
        `User with wallet address ${walletAddress} not found`,
      );
    }

    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Only post creator can update it
    if (post.userId !== user.id) {
      throw new ForbiddenException('You can only update your own posts');
    }

    // If changing board, verify the new board exists
    if (updatePostDto.boardId) {
      const board = await this.prisma.board.findUnique({
        where: { id: updatePostDto.boardId },
      });

      if (!board) {
        throw new NotFoundException(
          `Board with ID ${updatePostDto.boardId} not found`,
        );
      }
    }

    return this.prisma.post.update({
      where: { id },
      data: updatePostDto,
      include: {
        User: {
          select: {
            walletAddress: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  async remove(id: string, walletAddress: string): Promise<Post> {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      throw new NotFoundException(
        `User with wallet address ${walletAddress} not found`,
      );
    }

    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Only post creator can delete it
    if (post.userId !== user.id) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    return this.prisma.post.delete({
      where: { id },
    });
  }

  async upvote(id: string, walletAddress: string): Promise<ExtendedPost> {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      throw new NotFoundException(
        `User with wallet address ${walletAddress} not found`,
      );
    }

    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        upvotedBy: true,
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Check if user has already upvoted
    const hasUpvoted = post.upvotedBy.some((upvoter) => upvoter.id === user.id);

    if (hasUpvoted) {
      // Remove upvote
      const updatedPost = await this.prisma.post.update({
        where: { id },
        data: {
          upvotedBy: {
            disconnect: {
              id: user.id,
            },
          },
        },
        include: {
          User: {
            select: {
              walletAddress: true,
              name: true,
              avatar: true,
            },
          },
          upvotedBy: {
            where: {
              id: user.id,
            },
          },
          _count: {
            select: {
              Comment: true,
              upvotedBy: true,
            },
          },
        },
      });
      updatedPost.upvotedBy = undefined;
      return {
        ...updatedPost,
        isUpvoted: false,
      };
    }

    // Add upvote
    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: {
        upvotedBy: {
          connect: {
            id: user.id,
          },
        },
      },
      include: {
        User: {
          select: {
            walletAddress: true,
            name: true,
            avatar: true,
          },
        },
        upvotedBy: {
          where: {
            id: user.id,
          },
        },
        _count: {
          select: {
            Comment: true,
            upvotedBy: true,
          },
        },
      },
    });

    updatedPost.upvotedBy = undefined;

    return {
      ...updatedPost,
      isUpvoted: true,
    };
  }

  async findBySlug(
    slug: string,
    walletAddress?: string,
  ): Promise<ExtendedPost> {
    let userId: string | undefined;

    if (walletAddress) {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });
      userId = user?.id;
    }

    const post = await this.prisma.post.findUnique({
      where: { slug },
      include: {
        User: {
          select: {
            walletAddress: true,
            name: true,
            avatar: true,
          },
        },
        Board: {
          select: {
            id: true,
            name: true,
            slug: true,
            theme: true,
          },
        },
        Comment: {
          include: {
            user: {
              select: {
                walletAddress: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        upvotedBy: userId
          ? {
              where: {
                id: userId,
              },
            }
          : false,
        _count: {
          select: {
            Comment: true,
            upvotedBy: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with slug ${slug} not found`);
    }

    const isUpvoted = userId ? post.upvotedBy.length > 0 : false;

    post.upvotedBy = undefined;

    return {
      ...post,
      isUpvoted,
    };
  }
}
