import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';
import { Evento, EventoRequest } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class EventosService {
  private readonly http = inject(HttpClient);

  listar(paroquiaId?: number): Observable<Evento[]> {
    let params = new HttpParams();
    if (paroquiaId) params = params.set('paroquiaId', paroquiaId);
    return this.http.get<Evento[]>(`${API_BASE_URL}/eventos`, { params });
  }

  criar(request: EventoRequest): Observable<Evento> {
    return this.http.post<Evento>(`${API_BASE_URL}/eventos`, this.limpar(request));
  }

  atualizar(id: number, request: EventoRequest): Observable<Evento> {
    return this.http.put<Evento>(`${API_BASE_URL}/eventos/${id}`, this.limpar(request));
  }

  private limpar<T extends object>(objeto: T): T {
    const copia: Record<string, unknown> = {};
    for (const [chave, valor] of Object.entries(objeto)) {
      copia[chave] = valor === '' ? undefined : valor;
    }
    return copia as T;
  }
}
