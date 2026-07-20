export class BusinessError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 422,
    public details?: unknown[]
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}
