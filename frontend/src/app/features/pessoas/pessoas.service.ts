import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';
import { Pessoa, PessoaRequest } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class PessoasService {
  private readonly http = inject(HttpClient);

  listar(busca?: string): Observable<Pessoa[]> {
    let params = new HttpParams();
    if (busca?.trim()) params = params.set('busca', busca.trim());
    return this.http.get<Pessoa[]>(`${API_BASE_URL}/pessoas`, { params });
  }

  criar(request: PessoaRequest): Observable<Pessoa> {
    return this.http.post<Pessoa>(`${API_BASE_URL}/pessoas`, this.limpar(request));
  }

  atualizar(id: number, request: PessoaRequest): Observable<Pessoa> {
    return this.http.put<Pessoa>(`${API_BASE_URL}/pessoas/${id}`, this.limpar(request));
  }

  private limpar<T extends object>(objeto: T): T {
    const copia: Record<string, unknown> = {};
    for (const [chave, valor] of Object.entries(objeto)) {
      copia[chave] = valor === '' ? undefined : valor;
    }
    return copia as T;
  }
}
