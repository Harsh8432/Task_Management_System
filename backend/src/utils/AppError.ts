// Custom error class for consistent error handling
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string | undefined;
  details?: Record<string, any> | undefined;

  constructor(message: string, statusCode: number, code?: string, details?: Record<string, any>) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  this.code = code;
  this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
