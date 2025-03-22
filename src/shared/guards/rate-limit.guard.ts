import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { shouldRateLimit } from '../utils/security.utils';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private store = new Map<string, number[]>();

  // Default limits
  private readonly defaultLimit = 100; // requests
  private readonly defaultWindowMs = 15 * 60 * 1000; // 15 minutes

  // Stricter limits for auth endpoints
  private readonly authLimit = 5; // requests
  private readonly authWindowMs = 5 * 60 * 1000; // 5 minutes

  // Stricter limits for post/comment creation
  private readonly createLimit = 10; // requests
  private readonly createWindowMs = 5 * 60 * 1000; // 5 minutes

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const path = request.path;
    const method = request.method;

    // Generate a key based on IP and path
    const key = `${ip}:${path}:${method}`;

    // Determine limits based on endpoint type
    let limit = this.defaultLimit;
    let windowMs = this.defaultWindowMs;

    // Stricter limits for auth endpoints
    if (path.includes('auth')) {
      limit = this.authLimit;
      windowMs = this.authWindowMs;
    }

    // Stricter limits for post/comment creation
    if (
      (path.includes('posts') || path.includes('comments')) &&
      method === 'POST'
    ) {
      limit = this.createLimit;
      windowMs = this.createWindowMs;
    }

    if (shouldRateLimit(key, limit, windowMs, this.store)) {
      throw new HttpException(
        'Too many requests, please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
