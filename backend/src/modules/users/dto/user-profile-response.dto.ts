import { UserEntity } from '../entities/user.entity';

export class UserProfileResponseDto {
  id: string;
  phoneNumber: string;
  name: string | null;
  address: string | null;
  pincode: string | null;
  district: string | null;
  region: string | null;
  isProfileComplete: boolean;
  createdAt: string;

  static fromEntity(entity: UserEntity): UserProfileResponseDto {
    const dto = new UserProfileResponseDto();
    dto.id = entity.id;
    dto.phoneNumber = entity.phone_number;
    dto.name = entity.name;
    dto.address = entity.address;
    dto.pincode = entity.pincode;
    dto.district = entity.district;
    dto.region = entity.region;
    dto.isProfileComplete = Boolean(entity.name && entity.address && entity.pincode && entity.district);
    dto.createdAt = entity.created_at ? new Date(entity.created_at).toISOString() : new Date().toISOString();
    return dto;
  }
}
