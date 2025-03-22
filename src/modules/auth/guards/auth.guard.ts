import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../auth.jwt.guard';
import * as jwt from 'jsonwebtoken';
import { ADMIN_ROLE, USER_ROLE } from '../auth.constants';

@Injectable()
export class AuthGuard implements CanActivate {
  private jwtAuthGuard: JwtAuthGuard;

  constructor(private reflector: Reflector) {
    this.jwtAuthGuard = new JwtAuthGuard(reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      return false;
    }
    const decoded = jwt.decode(token) as jwt.JwtPayload;

    request.user = decoded;

    return (
      decoded &&
      ((decoded.role as string) === USER_ROLE ||
        (decoded.role as string) === ADMIN_ROLE)
    );
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
}
