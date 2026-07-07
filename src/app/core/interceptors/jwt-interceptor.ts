import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // If the request targets our backend API, set withCredentials to true to send the HttpOnly Cookie
  if (req.url.startsWith(environment.apiUrl)) {
    req = req.clone({
      withCredentials: true,
    });
  }
  return next(req);
};
