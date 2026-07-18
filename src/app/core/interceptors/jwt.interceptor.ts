import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(environment.apiUrl)) {
    req = req.clone({
      withCredentials: true,
    });
  }
  return next(req);
};
