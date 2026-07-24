import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: { id: string; email: string };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await argon2.hash(dto.password);

    // Ensure the "customer" role exists, then attach it.
    const customerRole = await this.prisma.role.upsert({
      where: { key: 'customer' },
      update: {},
      create: { key: 'customer', label: 'Customer' },
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        roles: { create: { roleId: customerRole.id } },
        customer: { create: { fullName: dto.fullName ?? null } },
      },
    });

    return this.issueTokens(user.id, user.email);
  }

  async login(dto: LoginDto, meta?: { ip?: string; userAgent?: string }): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.issueTokens(user.id, user.email, meta);
  }

  private async issueTokens(
    userId: string,
    email: string,
    meta?: { ip?: string; userAgent?: string },
  ): Promise<AuthResult> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<number>('JWT_ACCESS_TTL', 900),
      },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<number>('JWT_REFRESH_TTL', 1209600),
      },
    );

    // Persist a hashed refresh token so sessions can be revoked.
    const refreshTokenHash = await argon2.hash(refreshToken);
    const ttlMs = this.config.get<number>('JWT_REFRESH_TTL', 1209600) * 1000;
    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        ip: meta?.ip ?? null,
        userAgent: meta?.userAgent ?? null,
        expiresAt: new Date(Date.now() + ttlMs),
      },
    });

    return { accessToken, refreshToken, user: { id: userId, email } };
  }
}
