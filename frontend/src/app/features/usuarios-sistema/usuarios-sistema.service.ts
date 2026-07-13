import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PerfilUsuario } from '../../core/auth/auth.models';

export interface UsuarioSistema {
  id: number;
  nome: string;
  username: string;
  perfil: PerfilUsuario;
  perfilDescricao: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CriarUsuarioSistemaRequest {
  nome: string;
  username: string;
  senha: string;
  perfil: PerfilUsuario;
}

export interface AtualizarUsuarioSistemaRequest {
  nome: string;
  perfil: PerfilUsuario;
}

export interface ResetarSenhaUsuarioSistemaRequest {
  novaSenha: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosSistemaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/usuarios-sistema`;

  listar(): Observable<UsuarioSistema[]> {
    return this.http.get<UsuarioSistema[]>(this.apiUrl);
  }

  criar(request: CriarUsuarioSistemaRequest): Observable<UsuarioSistema> {
    return this.http.post<UsuarioSistema>(this.apiUrl, request);
  }

  atualizar(id: number, request: AtualizarUsuarioSistemaRequest): Observable<UsuarioSistema> {
    return this.http.patch<UsuarioSistema>(`${this.apiUrl}/${id}`, request);
  }

  ativar(id: number): Observable<UsuarioSistema> {
    return this.http.patch<UsuarioSistema>(`${this.apiUrl}/${id}/ativar`, {});
  }

  desativar(id: number): Observable<UsuarioSistema> {
    return this.http.patch<UsuarioSistema>(`${this.apiUrl}/${id}/desativar`, {});
  }

  resetarSenha(id: number, request: ResetarSenhaUsuarioSistemaRequest): Observable<UsuarioSistema> {
    return this.http.patch<UsuarioSistema>(`${this.apiUrl}/${id}/resetar-senha`, request);
  }
}
