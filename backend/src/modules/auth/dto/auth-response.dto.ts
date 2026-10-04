export class UserSummaryDto {
  id: string;
  phoneNumber: string;
  name: string | null;
  role: 'owner' | 'staff' | 'customer';
  isProfileComplete: boolean;
}

export class AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export class LoginResponseDto {
  tokens: AuthTokensDto;
  user: UserSummaryDto;
}
