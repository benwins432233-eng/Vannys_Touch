import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ResetPasswordDto,
  RefreshTokenDto,
  ConfirmEmailDto,
  ForgotPasswordDto,
  ResetPasswordWithTokenDto,
} from './dto/auth.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '@prisma/client';

class LogoutDto {
  @IsString()
  @IsOptional()
  refreshToken?: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Logout est Public : le token d'accès peut être expiré au moment du logout.
  // On invalide la session via le refreshToken fourni dans le body.
  // Si aucun refreshToken n'est fourni, la réponse est quand même 200
  // (le client a déjà supprimé ses tokens locaux).
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout — invalide le refresh token en base' })
  logout(@Body() dto: LogoutDto) {
    return this.authService.logoutByRefreshToken(dto.refreshToken);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  // ── Vérification d'email ──────────────────────────────────

  @Post('verify-email/request')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envoyer (ou renvoyer) le lien de vérification' })
  requestEmailVerification(@CurrentUser() user: User) {
    return this.authService.requestEmailVerification(user.id.toString());
  }

  @Public()
  @Post('verify-email/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmer une adresse email à partir du jeton reçu' })
  confirmEmail(@Body() dto: ConfirmEmailDto) {
    return this.authService.confirmEmail(dto);
  }

  // ── Mot de passe ──────────────────────────────────────────

  @Public()
  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demander un lien de réinitialisation' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Réinitialiser son mot de passe avec le jeton reçu' })
  resetPasswordWithToken(@Body() dto: ResetPasswordWithTokenDto) {
    return this.authService.resetPasswordWithToken(dto);
  }

  @Post('password/change')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Changer son mot de passe (mot de passe actuel exigé)' })
  changePassword(@CurrentUser() user: User, @Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(user.id.toString(), dto);
  }

  // ⚠️ Cette route était publique et acceptait { email, password } : n'importe qui
  // pouvait redéfinir le mot de passe de n'importe quel compte, administrateur compris.
  // Elle exige désormais une authentification et le mot de passe actuel.
  //
  // @deprecated Son nom prête à confusion : elle CHANGE un mot de passe connu,
  // elle ne le réinitialise pas. Utiliser POST /auth/password/change, ou
  // /auth/password/forgot + /auth/password/reset pour un mot de passe oublié.
  // Conservée le temps d'une version pour les clients déjà déployés.
  @Post('reset-password')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Déprécié] Voir POST /auth/password/change' })
  resetPassword(@CurrentUser() user: User, @Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(user.id.toString(), dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  me(@CurrentUser() user: User) {
    return this.authService.getMe(user.id.toString());
  }
}
