import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { ERROR_CODES, ERROR_MESSAGES } from '@shared/constants/error-message.constants';
import { ErrorHandlerService } from './error-handler.service';

function apiError(body: unknown, status = 400): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: body });
}

describe('ErrorHandlerService', () => {
  const service = new ErrorHandlerService();

  it('maps a numeric backend code to its Vietnamese message', () => {
    const error = apiError({ code: 2006, message: 'Current password is incorrect' });

    expect(service.getErrorKey(error)).toBe('INVALID_PASSWORD');
    expect(service.getMessage(error)).toBe('Mật khẩu hiện tại không chính xác.');
  });

  it('never leaks the English backend message', () => {
    const error = apiError({ code: 5003, message: 'Dish is out of stock' });

    expect(service.getMessage(error)).not.toContain('out of stock');
  });

  it('falls back to UNKNOWN_ERROR for an unmapped code', () => {
    const error = apiError({ code: 424242, message: 'Brand new backend error' });

    expect(service.getMessage(error)).toBe(ERROR_MESSAGES.UNKNOWN_ERROR);
  });

  it('reports a connection failure as NETWORK_ERROR', () => {
    expect(service.getMessage(apiError(null, 0))).toBe(ERROR_MESSAGES.NETWORK_ERROR);
  });

  it('falls back to UNKNOWN_ERROR for a non-HTTP error', () => {
    expect(service.getMessage(new Error('boom'))).toBe(ERROR_MESSAGES.UNKNOWN_ERROR);
  });

  it('returns UNKNOWN_ERROR for a blob body with no parsed code', () => {
    expect(service.getMessage(apiError(new Blob()))).toBe(ERROR_MESSAGES.UNKNOWN_ERROR);
  });

  it('extracts retryAfterSeconds from a rate-limited login', () => {
    const error = apiError({ code: 1004, result: { retryAfterSeconds: 42 } }, 429);

    expect(service.getErrorKey(error)).toBe('TOO_MANY_LOGIN_ATTEMPTS');
    expect(service.getRetryAfterSeconds(error)).toBe(42);
  });

  it('returns null retryAfterSeconds when absent', () => {
    expect(service.getRetryAfterSeconds(apiError({ code: 2001 }))).toBeNull();
  });

  it('extracts field errors only for INVALID_KEY', () => {
    const fields = { username: 'không được để trống' };

    expect(service.getValidationErrors(apiError({ code: 9901, result: fields }))).toEqual(fields);
    expect(service.getValidationErrors(apiError({ code: 2001 }))).toBeNull();
  });

  it('derives a name for every declared error code', () => {
    for (const [name, code] of Object.entries(ERROR_CODES)) {
      expect(service.getErrorKey(apiError({ code }))).toBe(name);
    }
  });

  it('has a non-empty message for every declared error code', () => {
    for (const name of Object.keys(ERROR_CODES)) {
      expect(ERROR_MESSAGES[name as keyof typeof ERROR_CODES]).toBeTruthy();
    }
  });
});
