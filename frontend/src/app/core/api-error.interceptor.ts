import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth/auth.service';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('Erro de API', error);

      const isLogin = req.url.includes('/auth/login');

      if (error.status === 401 && !isLogin) {
        auth.encerrarSessaoExpirada();
      }

      if (error.status === 403) {
        messageService.add({
          severity: 'warn',
          summary: 'Acesso negado',
          detail: error.error?.message || 'Seu perfil não permite realizar esta ação.'
        });
      }

      return throwError(() => error);
    })
  );
};
