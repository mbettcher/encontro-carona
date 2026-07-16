import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AlterarSenhaRequest,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  PerfilUsuario,
  RefreshTokenRequest,
  UsuarioLogado
} from './auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly apiUrl = environment.apiUrl;
  private readonly tokenStorageKey = 'encontro_carona_token';
  private readonly refreshTokenStorageKey = 'encontro_carona_refresh_token';
  private readonly usuarioStorageKey = 'encontro_carona_usuario';

  readonly token = signal<string | null>(localStorage.getItem(this.tokenStorageKey));
  readonly refreshToken = signal<string | null>(localStorage.getItem(this.refreshTokenStorageKey));
  readonly usuario = signal<UsuarioLogado | null>(this.carregarUsuarioStorage());

  readonly autenticado = computed(() => Boolean(
    this.usuario() &&
    (
      this.token() ||
      this.refreshToken()
    )
  ));

  readonly perfilAtual = computed<PerfilUsuario | null>(() => this.usuario()?.perfil ?? null);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, request)
      .pipe(
        tap(response => {
          this.salvarSessao(response);
        })
      );
  }

  renovarSessao(): Observable<LoginResponse> {
    const refreshToken = this.obterRefreshToken();

    if (!refreshToken) {
      this.encerrarSessaoExpirada();
      throw new Error('Refresh token não encontrado.');
    }

    const request: RefreshTokenRequest = {
      refreshToken
    };

    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/refresh`, request)
      .pipe(
        tap(response => {
          this.salvarSessao(response);
        })
      );
  }

  alterarSenha(request: AlterarSenhaRequest): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/auth/alterar-senha`, request)
      .pipe(
        tap(() => {
          this.limparSessao();
        })
      );
  }

  logout(): void {
    const refreshToken = this.obterRefreshToken();

    if (refreshToken) {
      const request: LogoutRequest = {
        refreshToken
      };

      this.http.post<void>(`${this.apiUrl}/auth/logout`, request).subscribe({
        next: () => this.finalizarLogoutLocal(),
        error: () => this.finalizarLogoutLocal()
      });

      return;
    }

    this.finalizarLogoutLocal();
  }

  encerrarSessaoExpirada(): void {
    this.limparSessao();
    void this.router.navigate(['/login'], {
      queryParams: { motivo: 'sessao-expirada' }
    });
  }

  /**
   * Mantido por compatibilidade com o auth.guard existente.
   *
   * Antes do refresh token, access token vencido significava sessão expirada.
   * Agora, access token vencido não encerra a sessão se ainda houver refresh token.
   */
  sessaoExpirada(): boolean {
    if (this.refreshToken()) {
      return false;
    }

    const token = this.token();

    if (!token) {
      return false;
    }

    const exp = this.obterExpiracaoToken(token);

    if (!exp) {
      return true;
    }

    return Date.now() >= exp * 1000;
  }

  obterToken(): string | null {
    return this.token();
  }

  obterRefreshToken(): string | null {
    return this.refreshToken();
  }

  accessTokenExpirado(margemSegundos = 10): boolean {
    const token = this.token();

    if (!token) {
      return false;
    }

    const exp = this.obterExpiracaoToken(token);

    if (!exp) {
      return true;
    }

    return Date.now() >= (exp - margemSegundos) * 1000;
  }

  possuiPerfil(...perfis: PerfilUsuario[]): boolean {
    const usuario = this.usuario();

    if (!usuario) {
      return false;
    }

    return perfis.includes(usuario.perfil);
  }

  hasAnyPerfil(perfis: PerfilUsuario[] | undefined | null): boolean {
    if (!perfis || perfis.length === 0) {
      return true;
    }

    return this.possuiPerfil(...perfis);
  }

  isAuthenticated(): boolean {
    return this.autenticado();
  }

  podeAdministrar(): boolean {
    return this.possuiPerfil('ADMIN');
  }

  podeEscrever(): boolean {
    return this.possuiPerfil('ADMIN', 'OPERADOR_ADMIN');
  }

  podeEditarCadastros(): boolean {
    return this.podeEscrever();
  }

  podeOperar(): boolean {
    return this.possuiPerfil('ADMIN', 'OPERADOR_ADMIN');
  }

  podeVerCadastros(): boolean {
    return this.possuiPerfil('ADMIN', 'OPERADOR_ADMIN', 'OPERADOR_LEITURA');
  }

  podeVerOperacao(): boolean {
    return this.possuiPerfil('ADMIN', 'OPERADOR_ADMIN', 'OPERADOR_LEITURA');
  }

  podeVerCredenciais(): boolean {
    return this.possuiPerfil('ADMIN', 'OPERADOR_ADMIN', 'OPERADOR_LEITURA', 'SOMENTE_LEITURA');
  }

  podeSomenteLer(): boolean {
    return this.possuiPerfil('OPERADOR_LEITURA', 'SOMENTE_LEITURA');
  }

  podeImprimir(): boolean {
    return this.possuiPerfil('ADMIN', 'OPERADOR_ADMIN', 'OPERADOR_LEITURA', 'SOMENTE_LEITURA');
  }

  labelPerfil(perfil: PerfilUsuario | null | undefined): string {
    switch (perfil) {
      case 'ADMIN':
        return 'Administrador';
      case 'OPERADOR_ADMIN':
        return 'Operador administrador';
      case 'OPERADOR_LEITURA':
        return 'Operador leitura';
      case 'SOMENTE_LEITURA':
        return 'Somente leitura';
      default:
        return 'Não identificado';
    }
  }

  private salvarSessao(response: LoginResponse): void {
    const refreshToken = response.refreshToken;

    if (!refreshToken) {
      console.error('LoginResponse sem refreshToken:', response);
      throw new Error('Resposta de login inválida: refreshToken não recebido.');
    }

    localStorage.setItem(this.tokenStorageKey, response.accessToken);
    localStorage.setItem(this.refreshTokenStorageKey, refreshToken);
    localStorage.setItem(this.usuarioStorageKey, JSON.stringify(response.usuario));

    this.token.set(response.accessToken);
    this.refreshToken.set(refreshToken);
    this.usuario.set(response.usuario);
  }

  private finalizarLogoutLocal(): void {
    this.limparSessao();
    void this.router.navigateByUrl('/login');
  }

  private limparSessao(): void {
    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.refreshTokenStorageKey);
    localStorage.removeItem(this.usuarioStorageKey);

    this.token.set(null);
    this.refreshToken.set(null);
    this.usuario.set(null);
  }

  private carregarUsuarioStorage(): UsuarioLogado | null {
    const valor = localStorage.getItem(this.usuarioStorageKey);

    if (!valor) {
      return null;
    }

    try {
      return JSON.parse(valor) as UsuarioLogado;
    } catch {
      localStorage.removeItem(this.usuarioStorageKey);
      return null;
    }
  }

  private obterExpiracaoToken(token: string): number | null {
    try {
      const partes = token.split('.');

      if (partes.length !== 3) {
        return null;
      }

      const payload = JSON.parse(atob(partes[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };

      return payload.exp ?? null;
    } catch {
      return null;
    }
  }
}