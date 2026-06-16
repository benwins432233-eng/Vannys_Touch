import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto, LoginDto, ResetPasswordDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';

const toId = (id: string | number | bigint): bigint => {
  try {
    return BigInt(id);
  } catch {
    throw new BadRequestException(`Invalid ID format: ${id}`);
  }
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: hashed,
        phone: dto.phone,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    this.mail.sendWelcome(user).catch(() => null);
    this.mail.sendAdminNewUser(user).catch(() => null);

    const { password, refreshToken, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    const { password, refreshToken, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  }

  // Logout via userId (route protégée — non utilisée actuellement mais conservée)
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: toId(userId) },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  // Logout via refreshToken — fonctionne même si l'access token est expiré.
  // Si aucun refreshToken n'est fourni, on répond 200 directement
  // (le client a déjà supprimé ses tokens locaux, c'est suffisant).
  async logoutByRefreshToken(refreshToken?: string): Promise<{ message: string }> {
    if (!refreshToken) {
      return { message: 'Logged out successfully' };
    }

    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      });

      // Invalider le refresh token en base sans vérifier sa valeur hashée
      // (on fait confiance à la signature JWT qui a déjà été validée ci-dessus)
      await this.prisma.user.update({
        where: { id: BigInt(payload.sub) },
        data: { refreshToken: null },
      });
    } catch {
      // Token invalide ou expiré : pas grave, on considère la session terminée
    }

    return { message: 'Logged out successfully' };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({ where: { id: BigInt(payload.sub) } });
      if (!user || !user.refreshToken) throw new Error();

      const matches = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!matches) throw new Error();

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.saveRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('User not found');

    const hashed = await bcrypt.hash(dto.password, 10);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, refreshToken: null },
    });

    this.mail.sendPasswordReset(updated).catch(() => null);

    return { message: 'Password updated successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: toId(userId) } });
    const { password, refreshToken, ...safeUser } = user;
    return safeUser;
  }

  // ─── Private helpers ──────────────────────────────────────────

  private async generateTokens(userId: bigint, email: string, role: string) {
    const payload = { sub: userId.toString(), email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: bigint, token: string) {
    const hashed = await bcrypt.hash(token, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }
}
