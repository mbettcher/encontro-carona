import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';
import { DuplaTioCarona, Evento, Sobrinho, TioCaronaEvento } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class EventoOperacaoService {
  private readonly http = inject(HttpClient);

  listarEventos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${API_BASE_URL}/eventos`);
  }

  listarTiosCarona(eventoId: number): Observable<TioCaronaEvento[]> {
    return this.http.get<TioCaronaEvento[]>(`${API_BASE_URL}/eventos/${eventoId}/tios-carona`);
  }

  listarDuplas(eventoId: number): Observable<DuplaTioCarona[]> {
    return this.http.get<DuplaTioCarona[]>(`${API_BASE_URL}/eventos/${eventoId}/duplas`);
  }

  listarSobrinhos(eventoId: number): Observable<Sobrinho[]> {
    return this.http.get<Sobrinho[]>(`${API_BASE_URL}/eventos/${eventoId}/sobrinhos`);
  }
}
