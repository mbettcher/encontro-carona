import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  catchError,
  finalize,
  Observable,
  shareReplay,
  switchMap,
  throwError
} from 'rxjs';

import { environment } from 'src/environments/environment';
import { LoginResponse } from './auth.models';
import { AuthService } from './auth.service';

let refreshEmAndamento$: Observable<LoginResponse> | null = null;

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
  const refreshToken = auth.obterRefreshToken();

  /*
   * Fluxo principal:
   * Se o access token já está expirado, renova ANTES de enviar a requisição.
   * Isso evita receber 401 em operações como salvar evento, listar eventos etc.
   */
  if (token && refreshToken && auth.accessTokenExpirado()) {
    return obterRefresh$(auth).pipe(
      switchMap((): Observable<HttpEvent<unknown>> => {
        const novoToken = auth.obterToken();

        if (!novoToken) {
          auth.encerrarSessaoExpirada();
          return throwError(() => new Error('Sessão expirada.'));
        }

        return next(adicionarBearerToken(req, novoToken));
      }),
      catchError((refreshError: unknown): Observable<HttpEvent<unknown>> => {
        auth.encerrarSessaoExpirada();
        return throwError(() => refreshError);
      })
    );
  }

  const requestAutenticado = token ? adicionarBearerToken(req, token) : req;

  /*
   * Fluxo de fallback:
   * Se por algum motivo o backend ainda responder 401, tenta renovar e repetir.
   */
  return next(requestAutenticado).pipe(
    catchError((error: unknown): Observable<HttpEvent<unknown>> => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      if (!auth.obterRefreshToken()) {
        auth.encerrarSessaoExpirada();
        return throwError(() => error);
      }

      return obterRefresh$(auth).pipe(
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

function obterRefresh$(auth: AuthService): Observable<LoginResponse> {
  if (!refreshEmAndamento$) {
    refreshEmAndamento$ = auth.renovarSessao().pipe(
      shareReplay(1),
      finalize(() => {
        refreshEmAndamento$ = null;
      })
    );
  }

  return refreshEmAndamento$;
}

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