import { HttpContext, HttpContextToken } from '@angular/common/http';

export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

export function skipErrorToast(context: HttpContext = new HttpContext()): HttpContext {
  return context.set(SKIP_ERROR_TOAST, true);
}
