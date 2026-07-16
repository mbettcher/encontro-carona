import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('Erro de API', error);

      /*
       * 401 agora é responsabilidade do authTokenInterceptor.
       *
       * Se o access token expirou, ele tenta renovar com /api/auth/refresh.
       * Se o refresh token falhar, aí sim o authTokenInterceptor encerra a sessão.
       *
       * Portanto, este interceptor não pode redirecionar em 401.
       */
      if (error.status === 401) {
        return throwError(() => error);
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