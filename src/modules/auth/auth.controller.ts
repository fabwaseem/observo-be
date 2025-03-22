import { Body, Controller, Post, Request, Response } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JWT_EXPIRY_SECONDS } from '../../shared/constants/global.constants';
import { AuthService } from './auth.service';
import { AuthResponseDTO, AuthUserDTO } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('authenticate')
  @ApiOperation({ description: 'Authenticate user' })
  @ApiBody({ type: AuthUserDTO })
  @ApiResponse({ type: AuthResponseDTO })
  async authenticate(
    @Body() authUser: AuthUserDTO,
    @Response() res,
    @Request() req,
  ): Promise<AuthResponseDTO> {
    const sessionId = req.cookies['anonymous_session'] || null;

    const authData = await this.authService.authenticate(authUser, sessionId);

    // res.cookie('accessToken', authData.accessToken, {
    //   expires: new Date(new Date().getTime() + JWT_EXPIRY_SECONDS * 1000),
    //   sameSite: 'strict',
    //   secure: true,
    //   httpOnly: true,
    // });

    if (authData.removeSession) {
      res.cookie('anonymous_session', '', {
        expires: new Date(0),
        sameSite: 'strict',
        secure: true,
      });
    }

    return res.status(200).send(authData);
  }
}
