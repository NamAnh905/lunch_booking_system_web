import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@shared/models/base.model';
import {
  DEFAULT_ERROR_KEY,
  ERROR_CODE_NAMES,
  ERROR_MESSAGES,
  ErrorMessageKey,
} from '@shared/constants/error-message.constants';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  getErrorKey(error: unknown): ErrorMessageKey {
    if (!(error instanceof HttpErrorResponse)) {
      return DEFAULT_ERROR_KEY;
    }

    if (error.status === 0) {
      return 'NETWORK_ERROR';
    }

    const body = error.error as ApiResponse<unknown> | null;
    const key = typeof body?.code === 'number' ? ERROR_CODE_NAMES[body.code] : undefined;

    return key ?? DEFAULT_ERROR_KEY;
  }

  getMessage(error: unknown): string {
    return ERROR_MESSAGES[this.getErrorKey(error)];
  }

  getRetryAfterSeconds(error: unknown): number | null {
    if (!(error instanceof HttpErrorResponse)) {
      return null;
    }

    const body = error.error as ApiResponse<{ retryAfterSeconds?: number }> | null;
    const seconds = body?.result?.retryAfterSeconds;

    return typeof seconds === 'number' ? seconds : null;
  }

  getValidationErrors(error: unknown): Record<string, string> | null {
    if (this.getErrorKey(error) !== 'INVALID_KEY') {
      return null;
    }

    const body = (error as HttpErrorResponse).error as ApiResponse<Record<string, string>>;

    return body?.result ?? null;
  }
}
