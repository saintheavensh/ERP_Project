export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export class Pagination {
    static fromQuery(query: any): Required<PaginationParams> {
        const page = Math.max(1, parseInt(query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

        return { page, limit, sortBy, sortOrder };
    }

    static toSql(params: Required<PaginationParams>) {
        const offset = (params.page - 1) * params.limit;
        return {
            limit: params.limit,
            offset,
            orderBy: { [params.sortBy]: params.sortOrder }
        };
    }

    static createResult<T>(
        data: T[],
        total: number,
        params: Required<PaginationParams>
    ): PaginatedResult<T> {
        const totalPages = Math.ceil(total / params.limit);

        return {
            data,
            meta: {
                page: params.page,
                limit: params.limit,
                totalItems: total,
                totalPages,
                hasNext: params.page < totalPages,
                hasPrev: params.page > 1
            }
        };
    }
}
