import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GLOBAL_CONFIG } from '../../configs/global.config';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';

import { AuthResponseDTO, AuthUserDTO } from './dto/auth.dto';

import { ethers } from 'ethers';
import {
  INVALID_ACCESS_TOKEN,
  INVALID_WALLET_ADDRESS,
  MISSING_SIGNED_MESSAGE_OR_SIGNATURE,
} from 'src/shared/constants/strings';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../shared/constants/global.constants';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  public async authenticate(
    authUser: AuthUserDTO,
    sessionId: string,
  ): Promise<AuthResponseDTO> {
    if (authUser.accessToken && authUser.accessToken.length > 0) {
      const payload = this.jwtService.verify(authUser.accessToken);
      const user = await this.userService.findUser({
        walletAddress: payload.walletAddress,
      });
      if (!user) {
        throw new UnauthorizedException({
          success: false,
          message: INVALID_ACCESS_TOKEN,
        });
      }

      return {
        walletAddress: user.walletAddress,
        accessToken: authUser.accessToken,
        removeSession: false,
      };
    }

    if (!authUser.signedMessage || !authUser.signature) {
      throw new BadRequestException({
        success: false,
        message: MISSING_SIGNED_MESSAGE_OR_SIGNATURE,
      });
    }

    let userWalletAddress: string;
    userWalletAddress = ethers
      .verifyMessage(authUser.signedMessage, authUser.signature)
      .toLowerCase();

    if (!this.isValidWalletAddress(userWalletAddress))
      throw new BadRequestException({
        success: false,
        message: INVALID_WALLET_ADDRESS,
      });

    let user = await this.userService.findUser({
      walletAddress: userWalletAddress,
    });

    if (!user) {
      user = await this.userService.createUser({
        walletAddress: userWalletAddress,
      });
    }
    let removeSession = false;
    if (sessionId) {
      // If user exists and has a session ID, link any temporary content
      await this.linkTempUsers(user.id, sessionId);
      removeSession = true;
    }

    const payload = user;
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: GLOBAL_CONFIG.security.expiresIn,
    });

    return {
      walletAddress: user.walletAddress,
      accessToken: accessToken,
      removeSession: removeSession,
    };
  }

  private isValidWalletAddress(walletAddress: string): boolean {
    return (
      ethers.isAddress(walletAddress) &&
      walletAddress.length === 42 &&
      walletAddress.startsWith('0x')
    );
  }

  private async linkTempUsers(userId: string, sessionId: string) {
    if (!sessionId) return;
    console.log('linking temp users');
    // Find all temporary users with this session ID
    const tempUser = await this.prisma.user.findUnique({
      where: {
        sessionId,
      },
      include: {
        Post: true,
        Comment: true,
        upvotedPosts: true,
      },
    });

    if (!tempUser) {
      return;
    }
    // For each temp user, transfer their content to the authenticated user
    // Update upvoted posts

    // Update all posts
    await this.prisma.post.updateMany({
      where: { userId: tempUser.id },
      data: { userId },
    });

    // Update all comments
    await this.prisma.comment.updateMany({
      where: { userId: tempUser.id },
      data: { userId },
    });

    // Delete the temporary user
    await this.prisma.user.delete({
      where: { id: tempUser.id },
    });
  }
}
