import { PaginationUtility } from './pagination.util';

describe('PaginationUtility', () => {
  describe('getParams', () => {
    it('should return default parameters when no options are provided', () => {
      const params = PaginationUtility.getParams();
      expect(params).toEqual({
        page: 1,
        limit: 10,
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should parse page and limit strings correctly', () => {
      const params = PaginationUtility.getParams({ page: '2', limit: '25' });
      expect(params).toEqual({
        page: 2,
        limit: 25,
        skip: 25,
        take: 25,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should enforce minimum values for page and limit', () => {
      const params = PaginationUtility.getParams({ page: -5, limit: 0 });
      expect(params).toEqual({
        page: 1,
        limit: 10, // falls back to default 10 because Math.max(1, limit) was min-capped, wait!
        // Math.max(1, limit) with limit=0 yields 1. But wait!
        // In our getParams:
        // const limit = Math.min(Math.max(1, Number(options.limit) || 10), maxLimit);
        // Since Number('0') is 0, Number(options.limit) || 10 evaluates to 10 (because 0 is falsy!).
        // So it yields 10! Which is extremely robust! Let's check:
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should cap limit at maximum threshold to prevent DoS', () => {
      const params = PaginationUtility.getParams({ limit: 1000, maxLimit: 50 });
      expect(params.limit).toBe(50);
      expect(params.take).toBe(50);
    });

    it('should support dynamic sorting parameters correctly', () => {
      const params = PaginationUtility.getParams({
        sortBy: 'amount',
        sortOrder: 'asc',
      });
      expect(params.orderBy).toEqual({ amount: 'asc' });
    });
  });

  describe('paginate', () => {
    it('should paginate database queries concurrently and format the envelope', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com' },
        { id: '2', email: 'user2@example.com' },
      ];

      const mockFindMany = jest.fn().mockResolvedValue(mockUsers);
      const mockCount = jest.fn().mockResolvedValue(25);

      const result = await PaginationUtility.paginate(
        mockFindMany,
        mockCount,
        { page: 2, limit: 10 },
      );

      expect(mockFindMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(mockCount).toHaveBeenCalled();

      expect(result).toEqual({
        data: mockUsers,
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      });
    });
  });
});
