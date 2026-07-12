import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth/auth.service';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('Erro de API', error);

      const isLogin = req.url.includes('/auth/login');

      if (error.status === 401 && !isLogin) {
        auth.encerrarSessaoExpirada();
      }

      return throwError(() => error);
    })
  );
};
