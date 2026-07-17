import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS', 'TRACE'];

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (!SAFE_METHODS.includes(req.method) && req.url.startsWith(environment.apiUrl)) {
    const token = readCookie(CSRF_COOKIE_NAME);
    if (token) {
      req = req.clone({ setHeaders: { [CSRF_HEADER_NAME]: token } });
    }
  }
  return next(req);
};
