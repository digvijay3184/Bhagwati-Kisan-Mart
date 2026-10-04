import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UserEntity } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  const mockUser: UserEntity = {
    id: 'user-uuid-1',
    phone_number: '+919876543210',
    name: 'Ram Singh',
    address: 'Plot 4, Kisan Nagar',
    pincode: '226001',
    district: 'Lucknow',
    region: 'Awadh',
    created_at: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    const mockRepo = {
      findById: jest.fn(),
      update: jest.fn(),
      findByPhoneNumber: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository);
  });

  describe('getProfile', () => {
    it('should return user profile response dto when user exists', async () => {
      repository.findById.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-uuid-1');

      expect(repository.findById).toHaveBeenCalledWith('user-uuid-1');
      expect(result.id).toEqual('user-uuid-1');
      expect(result.phoneNumber).toEqual('+919876543210');
      expect(result.name).toEqual('Ram Singh');
      expect(result.isProfileComplete).toBe(true);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getProfile('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should successfully update and return profile dto', async () => {
      repository.findById.mockResolvedValue(mockUser);
      const updatedUser: UserEntity = {
        ...mockUser,
        name: 'Ram Kumar Singh',
        address: 'New Village Road',
      };
      repository.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-uuid-1', {
        name: 'Ram Kumar Singh',
        address: 'New Village Road',
      });

      expect(repository.findById).toHaveBeenCalledWith('user-uuid-1');
      expect(repository.update).toHaveBeenCalledWith('user-uuid-1', {
        name: 'Ram Kumar Singh',
        address: 'New Village Road',
      });
      expect(result.name).toEqual('Ram Kumar Singh');
      expect(result.address).toEqual('New Village Road');
    });

    it('should throw NotFoundException if user does not exist before update', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.updateProfile('user-uuid-1', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if update returns null', async () => {
      repository.findById.mockResolvedValue(mockUser);
      repository.update.mockResolvedValue(null);

      await expect(
        service.updateProfile('user-uuid-1', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
