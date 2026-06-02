import { AdminPaginatedResponse } from '@repo/dto';

export interface PaginationOptions {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | string;
  maxLimit?: number;
}

export class PaginationUtility {
  /**
   * Cleans pagination parameters and returns safe skip, take, and orderBy for Prisma query.
   * Enforces min/max boundaries on parameters to prevent DoS attacks.
   */
  static getParams(options: PaginationOptions = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const maxLimit = options.maxLimit || 100;
    const limit = Math.min(
      Math.max(1, Number(options.limit) || 10),
      maxLimit,
    );
    const skip = (page - 1) * limit;

    const sortField = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder === 'asc' ? 'asc' : 'desc';

    return {
      page,
      limit,
      skip,
      take: limit,
      orderBy: { [sortField]: sortOrder },
    };
  }

  /**
   * Executes Prisma findMany and count queries concurrently,
   * returning a standardized AdminPaginatedResponse envelope.
   */
  static async paginate<T>(
    findMany: (options: { skip: number; take: number; orderBy?: any }) => Promise<T[]>,
    count: () => Promise<number>,
    options: PaginationOptions = {},
  ): Promise<AdminPaginatedResponse<T>> {
    const { page, limit, skip, take, orderBy } = this.getParams(options);

    const [data, total] = await Promise.all([
      findMany({ skip, take, orderBy }),
      count(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
