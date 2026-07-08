import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';
import { Paroquia, ParoquiaRequest } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ParoquiasService {
  private readonly http = inject(HttpClient);

  listar(): Observable<Paroquia[]> {
    return this.http.get<Paroquia[]>(`${API_BASE_URL}/paroquias`);
  }

  criar(request: ParoquiaRequest): Observable<Paroquia> {
    return this.http.post<Paroquia>(`${API_BASE_URL}/paroquias`, this.limpar(request));
  }

  atualizar(id: number, request: ParoquiaRequest): Observable<Paroquia> {
    return this.http.put<Paroquia>(`${API_BASE_URL}/paroquias/${id}`, this.limpar(request));
  }

  private limpar<T extends object>(objeto: T): T {
    const copia: Record<string, unknown> = {};
    for (const [chave, valor] of Object.entries(objeto)) {
      copia[chave] = valor === '' ? undefined : valor;
    }
    return copia as T;
  }
}
