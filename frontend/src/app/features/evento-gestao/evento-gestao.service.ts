import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';
import {
  DuplaTioCarona,
  DuplaTioCaronaRequest,
  Evento,
  Pessoa,
  Sobrinho,
  SobrinhoDupla,
  SobrinhoRequest,
  TioCaronaEvento,
  TioCaronaEventoRequest,
  VincularSobrinhoRequest
} from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class EventoGestaoService {
  private readonly http = inject(HttpClient);

  listarEventos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${API_BASE_URL}/eventos`);
  }

  listarPessoas(): Observable<Pessoa[]> {
    return this.http.get<Pessoa[]>(`${API_BASE_URL}/pessoas`);
  }

  listarTiosCarona(eventoId: number): Observable<TioCaronaEvento[]> {
    return this.http.get<TioCaronaEvento[]>(`${API_BASE_URL}/eventos/${eventoId}/tios-carona`);
  }

  adicionarTioCarona(eventoId: number, request: TioCaronaEventoRequest): Observable<TioCaronaEvento> {
    return this.http.post<TioCaronaEvento>(`${API_BASE_URL}/eventos/${eventoId}/tios-carona`, this.limpar(request));
  }

  listarDuplas(eventoId: number): Observable<DuplaTioCarona[]> {
    return this.http.get<DuplaTioCarona[]>(`${API_BASE_URL}/eventos/${eventoId}/duplas`);
  }

  criarDupla(eventoId: number, request: DuplaTioCaronaRequest): Observable<DuplaTioCarona> {
    return this.http.post<DuplaTioCarona>(`${API_BASE_URL}/eventos/${eventoId}/duplas`, this.limpar(request));
  }

  listarSobrinhos(eventoId: number): Observable<Sobrinho[]> {
    return this.http.get<Sobrinho[]>(`${API_BASE_URL}/eventos/${eventoId}/sobrinhos`);
  }

  criarSobrinho(eventoId: number, request: SobrinhoRequest): Observable<Sobrinho> {
    return this.http.post<Sobrinho>(`${API_BASE_URL}/eventos/${eventoId}/sobrinhos`, this.limpar(request));
  }

  listarSobrinhosDaDupla(eventoId: number, duplaId: number): Observable<SobrinhoDupla[]> {
    return this.http.get<SobrinhoDupla[]>(`${API_BASE_URL}/eventos/${eventoId}/vinculos/duplas/${duplaId}/sobrinhos`);
  }

  vincularSobrinho(eventoId: number, request: VincularSobrinhoRequest): Observable<SobrinhoDupla> {
    return this.http.post<SobrinhoDupla>(`${API_BASE_URL}/eventos/${eventoId}/vinculos`, request);
  }

  private limpar<T extends object>(objeto: T): T {
    const copia: Record<string, unknown> = {};
    for (const [chave, valor] of Object.entries(objeto)) {
      copia[chave] = valor === '' ? undefined : valor;
    }
    return copia as T;
  }
}
