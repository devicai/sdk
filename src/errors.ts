import type { ApiError, InvalidSubagentRef } from './types.js';

export class DevicApiError extends Error {
  public statusCode: number;
  public errorType?: string;
  public field?: string;
  public invalidSubagents?: InvalidSubagentRef[];

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'DevicApiError';
    this.statusCode = error.statusCode;
    this.errorType = error.error;
    this.field = error.field;
    this.invalidSubagents = error.invalidSubagents;
  }

  toJSON() {
    return {
      error: this.message,
      code: this.errorType ?? `HTTP_${this.statusCode}`,
      statusCode: this.statusCode,
      ...(this.field ? { field: this.field } : {}),
      ...(this.invalidSubagents
        ? { invalidSubagents: this.invalidSubagents }
        : {}),
    };
  }
}
