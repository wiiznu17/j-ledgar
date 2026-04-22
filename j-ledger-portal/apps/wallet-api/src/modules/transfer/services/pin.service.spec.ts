import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PinService } from './pin.service';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('PinService', () => {
  let service: PinService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    pinAttempt: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PinService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PinService>(PinService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('validatePin', () => {
    const userId = 'user-123';
    const pin = '123456';
    const pinHash = '$2b$10$hashedpin';

    it('should validate PIN successfully and reset attempts', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        pinHash,
        pinLockedUntil: null,
        pinAttempts: 0,
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.validatePin(userId, pin);

      expect(prisma.pinAttempt.create).toHaveBeenCalledWith({
        data: { userId, attemptNumber: 1, success: true },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { pinAttempts: 0, pinLockedUntil: null },
      });
    });

    it('should throw ForbiddenException if account is locked', async () => {
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      mockPrismaService.user.findUnique.mockResolvedValue({
        pinHash,
        pinLockedUntil: lockUntil,
        pinAttempts: 3,
      });

      await expect(service.validatePin(userId, pin)).rejects.toThrow(ForbiddenException);
    });

    it('should track failed attempts and throw BadRequestException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        pinHash,
        pinLockedUntil: null,
        pinAttempts: 0,
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validatePin(userId, pin)).rejects.toThrow(BadRequestException);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { pinAttempts: 1 },
      });
    });

    it('should lock account after 3 failed attempts', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        pinHash,
        pinLockedUntil: null,
        pinAttempts: 2,
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validatePin(userId, pin)).rejects.toThrow(ForbiddenException);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          pinAttempts: 3,
          pinLockedUntil: expect.any(Date),
        },
      });
    });
  });
});
