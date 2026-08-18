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
import {
  RegisterDto,
  LoginDto,
  ResetPasswordDto,
  ForgotPasswordDto,
  ResetPasswordWithTokenDto,
  ConfirmEmailDto,
} from './dto/auth.dto';
import {
  expiryFor,
  generateToken,
  hashToken,
  isCoolingDown,
  isTokenUsable,
} from './account-token';
import { account_tokens_type } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

/**
 * Réponse unique de « mot de passe oublié ».
 *
 * Elle ne dit jamais si l'adresse existe : une réponse différente permettrait de
 * dresser la liste des comptes de la boutique en essayant des adresses au hasard.
 */
const FORGOT_PASSWORD_RESPONSE = {
  message:
    'Si un compte existe pour cette adresse, un email de réinitialisation vient de partir.',
};

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
    // Le lien de vérification part dès l'inscription : sans lui, la cliente
    // découvrirait l'obligation seulement au moment de commander.
    this.requestEmailVerification(user.id.toString()).catch(() => null);

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

  /**
   * Changement de mot de passe d'un utilisateur authentifié.
   * L'identifiant vient du jeton : impossible de viser le compte d'autrui.
   * Le mot de passe actuel est exigé, et toutes les sessions sont invalidées.
   */
  async resetPassword(userId: string, dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: toId(userId) } });
    if (!user) throw new NotFoundException('User not found');

    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, refreshToken: null },
    });

    this.mail.sendPasswordReset(updated).catch(() => null);

    return { message: 'Password updated successfully' };
  }

  // ── Vérification d'email ──────────────────────────────────────

  /**
   * Envoie (ou renvoie) le lien de vérification au compte connecté.
   * Répond toujours de la même façon, y compris pendant le délai d'attente :
   * l'interface n'a pas à distinguer ces cas.
   */
  async requestEmailVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: toId(userId) } });
    if (!user) throw new NotFoundException('User not found');

    if (user.email_verified_at) {
      return { message: 'Votre adresse email est déjà vérifiée.' };
    }

    const token = await this.issueToken(user.id, account_tokens_type.email_verification);
    if (token) {
      this.mail
        .sendEmailVerification(user, `${this.frontendUrl()}/verify-email?token=${token}`)
        .catch(() => null);
    }

    return {
      message: 'Un email de vérification vient de partir. Vérifiez votre boîte de réception.',
    };
  }

  async confirmEmail(dto: ConfirmEmailDto) {
    const record = await this.consumeToken(dto.token, account_tokens_type.email_verification);

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { email_verified_at: new Date() },
    });

    return { message: 'Votre adresse email est vérifiée. Merci !' };
  }

  // ── Mot de passe oublié ───────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    // Un compte inexistant ou désactivé suit exactement le même chemin :
    // même réponse, même temps de traitement perceptible.
    if (user?.isActive) {
      const token = await this.issueToken(user.id, account_tokens_type.password_reset);
      if (token) {
        this.mail
          .sendPasswordResetLink(user, `${this.frontendUrl()}/reset-password?token=${token}`)
          .catch(() => null);
      }
    }

    return FORGOT_PASSWORD_RESPONSE;
  }

  /**
   * Réinitialise le mot de passe à partir d'un jeton reçu par email.
   * Toutes les sessions sont invalidées : si le compte avait été détourné,
   * l'intrus est déconnecté par la même occasion.
   */
  async resetPasswordWithToken(dto: ResetPasswordWithTokenDto) {
    const record = await this.consumeToken(dto.token, account_tokens_type.password_reset);

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.update({
      where: { id: record.userId },
      data: { password: hashed, refreshToken: null },
    });

    this.mail.sendPasswordReset(user).catch(() => null);

    return { message: 'Votre mot de passe a été réinitialisé. Vous pouvez vous connecter.' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: toId(userId) } });
    const { password, refreshToken, ...safeUser } = user;
    return safeUser;
  }

  // ─── Private helpers ──────────────────────────────────────────

  private frontendUrl(): string {
    return this.config.get('FRONTEND_URL', 'http://localhost:5173');
  }

  /**
   * Crée un jeton et renvoie sa valeur en clair — la seule fois où elle existe.
   * Renvoie `null` si une demande vient d'être faite : mieux vaut ne rien
   * envoyer que d'offrir un moyen de noyer une boîte mail.
   */
  private async issueToken(userId: bigint, type: account_tokens_type): Promise<string | null> {
    const last = await this.prisma.accountToken.findFirst({
      where: { userId, type },
      orderBy: { createdAt: 'desc' },
    });
    if (isCoolingDown(last?.createdAt)) return null;

    // Les jetons encore valides du même type sont invalidés : un seul lien
    // actif à la fois, c'est celui qui vient d'être envoyé.
    await this.prisma.accountToken.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = generateToken();
    await this.prisma.accountToken.create({
      data: {
        userId,
        type,
        tokenHash: hashToken(token),
        expiresAt: expiryFor(type === account_tokens_type.email_verification
          ? 'email_verification'
          : 'password_reset'),
      },
    });

    return token;
  }

  /** Vérifie un jeton, le marque comme utilisé, et refuse tout le reste. */
  private async consumeToken(token: string, type: account_tokens_type) {
    const record = await this.prisma.accountToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });

    // Jeton inconnu, d'un autre type, déjà utilisé ou expiré : même message.
    // Distinguer ces cas renseignerait un attaquant sur ce qu'il a trouvé.
    if (!record || record.type !== type || !isTokenUsable(record)) {
      throw new BadRequestException(
        'Ce lien est invalide ou a expiré. Demandez-en un nouveau.',
      );
    }

    await this.prisma.accountToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    return record;
  }

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
