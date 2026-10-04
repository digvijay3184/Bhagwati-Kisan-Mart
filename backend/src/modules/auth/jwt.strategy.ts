import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from './decorators/current-user.decorator';

export interface JwtPayload {
  sub: string;
  phone: string;
  role?: 'customer' | 'owner' | 'staff';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('jwt.secret');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || 'temporary_secret_fallback',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload || !payload.sub || !payload.phone) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      userId: payload.sub,
      phoneNumber: payload.phone,
      role: payload.role || 'customer',
    };
  }
}
