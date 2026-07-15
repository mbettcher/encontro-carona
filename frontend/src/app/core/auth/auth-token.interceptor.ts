import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, Observable, switchMap, throwError } from 'rxjs';

import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

let refreshEmAndamento$: Observable<unknown> | null = null;

export const authTokenInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);

  const isApi = req.url.startsWith(environment.apiUrl) || req.url.startsWith('/api');
  const isAuthEndpoint = req.url.includes('/api/auth/login')
    || req.url.includes('/api/auth/refresh')
    || req.url.includes('/api/auth/logout');

  if (!isApi || isAuthEndpoint) {
    return next(req);
  }

  const token = auth.obterToken();
  const requestAutenticado = token ? adicionarBearerToken(req, token) : req;

  return next(requestAutenticado).pipe(
    catchError((error: unknown): Observable<HttpEvent<unknown>> => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      const refreshToken = auth.obterRefreshToken();

      if (!refreshToken) {
        auth.encerrarSessaoExpirada();
        return throwError(() => error);
      }

      const refresh$ = refreshEmAndamento$ ?? auth.renovarSessao().pipe(
        finalize(() => {
          refreshEmAndamento$ = null;
        })
      );

      refreshEmAndamento$ = refresh$;

      return refresh$.pipe(
        switchMap((): Observable<HttpEvent<unknown>> => {
          const novoToken = auth.obterToken();

          if (!novoToken) {
            auth.encerrarSessaoExpirada();
            return throwError(() => error);
          }

          return next(adicionarBearerToken(req, novoToken));
        }),
        catchError((refreshError: unknown): Observable<HttpEvent<unknown>> => {
          auth.encerrarSessaoExpirada();
          return throwError(() => refreshError);
        })
      );
    })
  );
};

function adicionarBearerToken(
  req: HttpRequest<unknown>,
  token: string
): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}