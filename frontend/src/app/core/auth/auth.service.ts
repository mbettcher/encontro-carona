import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AlterarSenhaRequest,
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

  private expiracaoTimerId: ReturnType<typeof setTimeout> | null = null;

  readonly token = signal<string | null>(localStorage.getItem(this.tokenStorageKey));
  readonly usuario = signal<UsuarioLogado | null>(this.carregarUsuarioStorage());

  readonly autenticado = computed(() => Boolean(this.token() && this.usuario() && !this.sessaoExpirada()));
  readonly perfilAtual = computed<PerfilUsuario | null>(() => this.usuario()?.perfil ?? null);

  constructor() {
    if (this.sessaoExpirada()) {
      this.limparSessao();
      return;
    }

    this.agendarExpiracaoToken();
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, request)
      .pipe(
        tap(response => {
          this.salvarSessao(response);
        })
      );
  }

  alterarSenha(request: AlterarSenhaRequest): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/auth/alterar-senha`, request);
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

  sessaoExpirada(): boolean {
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
    if (this.sessaoExpirada()) {
      this.encerrarSessaoExpirada();
      return null;
    }

    return this.token();
  }

  possuiPerfil(...perfis: PerfilUsuario[]): boolean {
    const usuario = this.usuario();

    if (!usuario || this.sessaoExpirada()) {
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

  podeImprimir(): boolean {
    return this.possuiPerfil('ADMIN', 'OPERADOR_ADMIN', 'OPERADOR_LEITURA', 'SOMENTE_LEITURA');
  }

  podeSomenteLer(): boolean {
    return this.possuiPerfil('OPERADOR_LEITURA', 'SOMENTE_LEITURA');
  }

  labelPerfil(perfil?: string | null): string {
    const perfilNormalizado = perfil ?? this.perfilAtual();

    switch (perfilNormalizado) {
      case 'ADMIN':
        return 'Administrador';

      case 'OPERADOR_ADMIN':
        return 'Operador administrador';

      case 'OPERADOR_LEITURA':
        return 'Operador leitura';

      case 'SOMENTE_LEITURA':
        return 'Somente leitura';

      default:
        return 'Perfil não identificado';
    }
  }

  private salvarSessao(response: LoginResponse): void {
    localStorage.setItem(this.tokenStorageKey, response.accessToken);
    localStorage.setItem(this.usuarioStorageKey, JSON.stringify(response.usuario));

    this.token.set(response.accessToken);
    this.usuario.set(response.usuario);
    this.agendarExpiracaoToken();
  }

  private limparSessao(): void {
    this.cancelarTimerExpiracao();

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

  private agendarExpiracaoToken(): void {
    this.cancelarTimerExpiracao();

    const token = this.token();

    if (!token) {
      return;
    }

    const exp = this.obterExpiracaoToken(token);

    if (!exp) {
      this.encerrarSessaoExpirada();
      return;
    }

    const delay = exp * 1000 - Date.now();

    if (delay <= 0) {
      this.encerrarSessaoExpirada();
      return;
    }

    this.expiracaoTimerId = setTimeout(() => {
      this.encerrarSessaoExpirada();
    }, delay + 500);
  }

  private cancelarTimerExpiracao(): void {
    if (this.expiracaoTimerId) {
      clearTimeout(this.expiracaoTimerId);
      this.expiracaoTimerId = null;
    }
  }

  private obterExpiracaoToken(token: string): number | null {
    try {
      const partes = token.split('.');

      if (partes.length !== 3) {
        return null;
      }

      const payloadBase64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson = atob(payloadBase64.padEnd(payloadBase64.length + (4 - payloadBase64.length % 4) % 4, '='));
      const payload = JSON.parse(payloadJson) as { exp?: number };

      return typeof payload.exp === 'number' ? payload.exp : null;
    } catch {
      return null;
    }
  }
}
