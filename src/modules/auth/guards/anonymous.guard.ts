import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';
import { ADMIN_ROLE, USER_ROLE } from '../auth.constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AnonymousGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const token = this.extractTokenFromRequest(request);

    // If token exists, treat as normal authenticated user
    if (token) {
      const decoded = jwt.decode(token) as jwt.JwtPayload;
      request.user = decoded;
      return true;
    }

    // For anonymous users, get or create session ID from cookie
    const sessionId = await this.getOrCreateSessionId(request, response);

    // Find or create temporary user based on session ID
    const tempUser = await this.findOrCreateTempUser(sessionId);

    // Attach temp user to request
    request.user = {
      id: tempUser.id,
      sessionId: tempUser.sessionId,
      isTempUser: true,
      role: USER_ROLE,
    };

    return true;
  }

  private extractTokenFromRequest(request: any): string {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return null;
    }

    const [bearer, token] = authorization.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }

  private async getOrCreateSessionId(
    request: any,
    response: any,
  ): Promise<string> {
    const COOKIE_NAME = 'anonymous_session';
    const COOKIE_OPTIONS = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined
    };

    let sessionId = request.cookies[COOKIE_NAME];

    if (!sessionId) {
      sessionId = uuidv4();
      response.cookie(COOKIE_NAME, sessionId, COOKIE_OPTIONS);
    }

    return sessionId;
  }

  private async findOrCreateTempUser(sessionId: string) {
    let tempUser = await this.prisma.user.findFirst({
      where: {
        sessionId,
        isTempUser: true,
      },
    });

    if (!tempUser) {
      tempUser = await this.prisma.user.create({
        data: {
          sessionId,
          isTempUser: true,
          name: 'Anonymous',
        },
      });
    }

    return tempUser;
  }
}
