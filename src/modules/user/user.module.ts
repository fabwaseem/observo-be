import { Module } from '@nestjs/common';

import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserListener } from './user.listener';

@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserService, UserListener],
  exports: [UserService],
})
export class UserModule {}
