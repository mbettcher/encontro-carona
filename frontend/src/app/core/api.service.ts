import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from './api.config';
import {
  DuplaTioCarona,
  DuplaTioCaronaRequest,
  Evento,
  EventoRequest,
  Paroquia,
  ParoquiaRequest,
  Pessoa,
  PessoaRequest,
  Sobrinho,
  SobrinhoDupla,
  SobrinhoRequest,
  TioCaronaEvento,
  TioCaronaEventoRequest,
  VincularSobrinhoRequest
} from '../shared/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  listarParoquias() {
    return this.http.get<Paroquia[]>(`${API_BASE_URL}/paroquias`);
  }

  criarParoquia(request: ParoquiaRequest) {
    return this.http.post<Paroquia>(`${API_BASE_URL}/paroquias`, this.limpar(request));
  }

  atualizarParoquia(id: number, request: ParoquiaRequest) {
    return this.http.put<Paroquia>(`${API_BASE_URL}/paroquias/${id}`, this.limpar(request));
  }

  listarEventos(paroquiaId?: number) {
    let params = new HttpParams();
    if (paroquiaId) params = params.set('paroquiaId', paroquiaId);
    return this.http.get<Evento[]>(`${API_BASE_URL}/eventos`, { params });
  }

  criarEvento(request: EventoRequest) {
    return this.http.post<Evento>(`${API_BASE_URL}/eventos`, this.limpar(request));
  }

  atualizarEvento(id: number, request: EventoRequest) {
    return this.http.put<Evento>(`${API_BASE_URL}/eventos/${id}`, this.limpar(request));
  }

  listarPessoas(busca?: string) {
    let params = new HttpParams();
    if (busca?.trim()) params = params.set('busca', busca.trim());
    return this.http.get<Pessoa[]>(`${API_BASE_URL}/pessoas`, { params });
  }

  criarPessoa(request: PessoaRequest) {
    return this.http.post<Pessoa>(`${API_BASE_URL}/pessoas`, this.limpar(request));
  }

  atualizarPessoa(id: number, request: PessoaRequest) {
    return this.http.put<Pessoa>(`${API_BASE_URL}/pessoas/${id}`, this.limpar(request));
  }

  listarTiosCarona(eventoId: number) {
    return this.http.get<TioCaronaEvento[]>(`${API_BASE_URL}/eventos/${eventoId}/tios-carona`);
  }

  adicionarTioCarona(eventoId: number, request: TioCaronaEventoRequest) {
    return this.http.post<TioCaronaEvento>(`${API_BASE_URL}/eventos/${eventoId}/tios-carona`, this.limpar(request));
  }

  listarDuplas(eventoId: number) {
    return this.http.get<DuplaTioCarona[]>(`${API_BASE_URL}/eventos/${eventoId}/duplas`);
  }

  criarDupla(eventoId: number, request: DuplaTioCaronaRequest) {
    return this.http.post<DuplaTioCarona>(`${API_BASE_URL}/eventos/${eventoId}/duplas`, this.limpar(request));
  }

  listarSobrinhos(eventoId: number) {
    return this.http.get<Sobrinho[]>(`${API_BASE_URL}/eventos/${eventoId}/sobrinhos`);
  }

  criarSobrinho(eventoId: number, request: SobrinhoRequest) {
    return this.http.post<Sobrinho>(`${API_BASE_URL}/eventos/${eventoId}/sobrinhos`, this.limpar(request));
  }

  listarSobrinhosDaDupla(eventoId: number, duplaId: number) {
    return this.http.get<SobrinhoDupla[]>(`${API_BASE_URL}/eventos/${eventoId}/vinculos/duplas/${duplaId}/sobrinhos`);
  }

  vincularSobrinho(eventoId: number, request: VincularSobrinhoRequest) {
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
