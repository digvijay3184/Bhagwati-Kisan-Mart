import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockProfile: UserProfileResponseDto = {
    id: 'user-uuid-1',
    phoneNumber: '+919876543210',
    name: 'Ram Singh',
    address: 'Plot 4, Kisan Nagar',
    pincode: '226001',
    district: 'Lucknow',
    region: 'Awadh',
    isProfileComplete: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    const mockService = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  describe('getProfile', () => {
    it('should return profile for the authenticated user', async () => {
      service.getProfile.mockResolvedValue(mockProfile);

      const result = await controller.getProfile('user-uuid-1');

      expect(service.getProfile).toHaveBeenCalledWith('user-uuid-1');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateProfile', () => {
    it('should update and return updated profile', async () => {
      const updateDto: UpdateProfileDto = {
        name: 'Ram Kumar Singh',
        address: 'New Village Road',
      };
      const updatedProfile = { ...mockProfile, ...updateDto };
      service.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile('user-uuid-1', updateDto);

      expect(service.updateProfile).toHaveBeenCalledWith(
        'user-uuid-1',
        updateDto,
      );
      expect(result).toEqual(updatedProfile);
    });
  });
});
