import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  PerfilUsuario,
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
  private readonly usuarioStorageKey = 'encontro_carona_usuario';

  readonly token = signal<string | null>(localStorage.getItem(this.tokenStorageKey));
  readonly usuario = signal<UsuarioLogado | null>(this.carregarUsuarioStorage());

  readonly autenticado = computed(() => Boolean(this.token() && this.usuario()));

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, request)
      .pipe(
        tap(response => {
          this.salvarSessao(response);
        })
      );
  }

  logout(): void {
    this.limparSessao();
    void this.router.navigateByUrl('/login');
  }

  encerrarSessaoExpirada(): void {
    this.limparSessao();
    void this.router.navigate(['/login'], {
      queryParams: { motivo: 'sessao-expirada' }
    });
  }

  obterToken(): string | null {
    return this.token();
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

  private salvarSessao(response: LoginResponse): void {
    localStorage.setItem(this.tokenStorageKey, response.accessToken);
    localStorage.setItem(this.usuarioStorageKey, JSON.stringify(response.usuario));

    this.token.set(response.accessToken);
    this.usuario.set(response.usuario);
  }

  private limparSessao(): void {
    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.usuarioStorageKey);

    this.token.set(null);
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
}
