import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerStorageRedisService } from './throttler-storage-redis.service';
import { REDIS_CLIENT } from '../common/constants';

describe('ThrottlerStorageRedisService', () => {
  let service: ThrottlerStorageRedisService;
  let mockRedis: any;

  beforeEach(async () => {
    mockRedis = {
      pttl: jest.fn(),
      incr: jest.fn(),
      pexpire: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThrottlerStorageRedisService,
        {
          provide: REDIS_CLIENT,
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<ThrottlerStorageRedisService>(ThrottlerStorageRedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('when Redis is fully functional', () => {
    it('should return isBlocked true if user is already blocked in Redis', async () => {
      mockRedis.pttl.mockResolvedValue(5000); // User is blocked with 5 seconds remaining

      const result = await service.increment('ip_127.0.0.1', 60000, 5, 10000, 'login');

      expect(mockRedis.pttl).toHaveBeenCalledWith('throttler:ip_127.0.0.1:login:blocked');
      expect(result).toEqual({
        totalHits: 6,
        timeToExpire: 5,
        isBlocked: true,
        timeToBlockExpire: 5,
      });
    });

    it('should increment hits and return standard non-blocked object', async () => {
      mockRedis.pttl
        .mockResolvedValueOnce(-2) // Not blocked (blocked key doesn't exist)
        .mockResolvedValueOnce(30000); // 30 seconds remaining on hits key
      mockRedis.incr.mockResolvedValue(2); // Hit count is 2 (less than limit 5)

      const result = await service.increment('ip_127.0.0.1', 60000, 5, 10000, 'login');

      expect(mockRedis.incr).toHaveBeenCalledWith('throttler:ip_127.0.0.1:login');
      expect(mockRedis.pexpire).not.toHaveBeenCalled(); // Only called on first hit
      expect(result).toEqual({
        totalHits: 2,
        timeToExpire: 30,
        isBlocked: false,
        timeToBlockExpire: 0,
      });
    });

    it('should pexpire hits key on first hit', async () => {
      mockRedis.pttl
        .mockResolvedValueOnce(-2) // Not blocked
        .mockResolvedValueOnce(60000); // 60 seconds remaining on hits key
      mockRedis.incr.mockResolvedValue(1); // First hit!

      const result = await service.increment('ip_127.0.0.1', 60000, 5, 10000, 'login');

      expect(mockRedis.incr).toHaveBeenCalled();
      expect(mockRedis.pexpire).toHaveBeenCalledWith('throttler:ip_127.0.0.1:login', 60000);
      expect(result.totalHits).toBe(1);
    });

    it('should block user and return isBlocked true when hit limit is exceeded', async () => {
      mockRedis.pttl
        .mockResolvedValueOnce(-2) // Not blocked
        .mockResolvedValueOnce(45000); // 45 seconds remaining on hits key
      mockRedis.incr.mockResolvedValue(6); // Exceeds limit 5

      const result = await service.increment('ip_127.0.0.1', 60000, 5, 10000, 'login');

      expect(mockRedis.set).toHaveBeenCalledWith('throttler:ip_127.0.0.1:login:blocked', '1', 'PX', 10000);
      expect(result).toEqual({
        totalHits: 6,
        timeToExpire: 45,
        isBlocked: true,
        timeToBlockExpire: 10,
      });
    });
  });

  describe('fallback path', () => {
    it('should gracefully fallback to in-memory throttling if Redis is missing key functions', async () => {
      // Remove incr function to simulate mock/broken Redis client
      const incompleteService = new ThrottlerStorageRedisService({} as any);

      // Increment should work using fallback in-memory storage
      const result1 = await incompleteService.increment('ip_127.0.0.1', 60000, 1, 10000, 'login');
      const result2 = await incompleteService.increment('ip_127.0.0.1', 60000, 1, 10000, 'login');

      expect(result1.isBlocked).toBe(false);
      expect(result1.totalHits).toBe(1);

      expect(result2.isBlocked).toBe(true);
      expect(result2.totalHits).toBe(2);
    });

    it('should gracefully fallback to in-memory throttling if Redis throws an exception', async () => {
      mockRedis.pttl.mockRejectedValue(new Error('Redis connection lost'));

      // Increment should successfully fallback to in-memory and not throw exception
      const result = await service.increment('ip_127.0.0.1', 60000, 5, 10000, 'login');

      expect(result).toBeDefined();
      expect(result.totalHits).toBe(1);
      expect(result.isBlocked).toBe(false);
    });
  });
});
