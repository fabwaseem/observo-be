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

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  public async authenticate(authUser: AuthUserDTO): Promise<AuthResponseDTO> {
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

    var user = await this.userService.findUser({
      walletAddress: userWalletAddress,
    });
    if (!user) {
      user = await this.userService.createUser({
        walletAddress: userWalletAddress,
      });
    }

    const payload = user;
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: GLOBAL_CONFIG.security.expiresIn,
    });

    return {
      walletAddress: user.walletAddress,
      accessToken: accessToken,
    };
  }

  private isValidWalletAddress(walletAddress: string): boolean {
    return (
      ethers.isAddress(walletAddress) &&
      walletAddress.length === 42 &&
      walletAddress.startsWith('0x')
    );
  }
  // private async signMessage(signedMessage: string) {
  //     const signature = await this.wallet.signMessage(signedMessage);
  //     return signature;
  //     console.log("Signed Message:", signedMessage);
  //     console.log("Signature:", signature);
  // }
}
