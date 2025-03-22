import { Post } from '@prisma/client';

export interface ExtendedPost extends Omit<Post, 'upvotedBy'> {
  isUpvoted?: boolean;
  User?: {
    walletAddress: string;
    name: string;
    avatar: string | null;
  };
  Board?: {
    id: string;
    name: string;
    slug: string;
    theme: string;
  };
  Comment?: Array<{
    id: string;
    content: string;
    createdAt: Date;
    user: {
      walletAddress: string;
      name: string;
      avatar: string | null;
    };
  }>;
  _count?: {
    Comment: number;
    upvotedBy: number;
  };
}
