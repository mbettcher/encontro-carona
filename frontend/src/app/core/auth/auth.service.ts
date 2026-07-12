import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

import { LoginRequest, LoginResponse, PerfilUsuario, UsuarioLogado } from './auth.models';

const TOKEN_KEY = 'encontro_carona_token';
const USER_KEY = 'encontro_carona_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  readonly usuario = signal<UsuarioLogado | null>(this.carregarUsuarioInicial());
  readonly autenticado = computed(() => !!this.token() && !!this.usuario());

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => this.salvarSessao(response))
    );
  }

  me(): Observable<UsuarioLogado> {
    return this.http.get<UsuarioLogado>(`${this.apiUrl}/me`).pipe(
      tap(usuario => {
        this.usuario.set(usuario);
        this.setStorage(USER_KEY, JSON.stringify(usuario));
      })
    );
  }

  token(): string | null {
    return this.getStorage(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return this.autenticado();
  }

  hasAnyPerfil(perfis: PerfilUsuario[] | undefined | null): boolean {
    if (!perfis || perfis.length === 0) {
      return this.isAuthenticated();
    }

    const usuario = this.usuario();

    return !!usuario && perfis.includes(usuario.perfil);
  }

  podeEscrever(): boolean {
    return this.hasAnyPerfil(['ADMIN', 'OPERADOR_ADMIN']);
  }

  logout(): void {
    this.limparSessao();
    void this.router.navigate(['/login']);
  }

  encerrarSessaoExpirada(): void {
    this.limparSessao();
    void this.router.navigate(['/login'], {
      queryParams: { motivo: 'sessao-expirada' }
    });
  }

  private salvarSessao(response: LoginResponse): void {
    this.setStorage(TOKEN_KEY, response.accessToken);
    this.setStorage(USER_KEY, JSON.stringify(response.usuario));
    this.usuario.set(response.usuario);
  }

  private limparSessao(): void {
    this.removeStorage(TOKEN_KEY);
    this.removeStorage(USER_KEY);
    this.usuario.set(null);
  }

  private carregarUsuarioInicial(): UsuarioLogado | null {
    const value = this.getStorage(USER_KEY);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as UsuarioLogado;
    } catch {
      this.removeStorage(USER_KEY);
      return null;
    }
  }

  private getStorage(key: string): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem(key);
  }

  private setStorage(key: string, value: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(key, value);
  }

  private removeStorage(key: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(key);
  }
}
