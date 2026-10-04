import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }
    return UserProfileResponseDto.fromEntity(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    const existing = await this.usersRepository.findById(userId);
    if (!existing) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const updated = await this.usersRepository.update(userId, dto);
    if (!updated) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return UserProfileResponseDto.fromEntity(updated);
  }
}
