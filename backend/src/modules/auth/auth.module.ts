import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SmsService } from './services/sms.service';
import { UsersModule } from '../users/users.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    UsersModule,
    AdminModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    SmsService,
  ],
  exports: [AuthService, JwtAuthGuard, JwtStrategy, UsersModule],
})
export class AuthModule {}
