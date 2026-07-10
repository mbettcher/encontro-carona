import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

import {
  AtualizarDuplaTioCaronaRequest,
  AtualizarTioCaronaEventoRequest,
  DuplaTioCarona,
  DuplaTioCaronaRequest,
  Evento,
  Pessoa,
  Sobrinho,
  SobrinhoDupla,
  SobrinhoRequest,
  TioCaronaEvento,
  TioCaronaEventoRequest,
  TrocarDuplaVinculoRequest,
  VincularSobrinhoRequest
} from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class EventoGestaoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  /**
   * O backend atual ainda não expõe GET /eventos/{id}.
   * Por isso buscamos a lista e localizamos o evento em memória.
   *
   * Quando o backend ganhar GET /eventos/{id}, este método poderá voltar
   * a chamar diretamente: GET /eventos/{eventoId}.
   */
  buscarEvento(eventoId: number): Observable<Evento> {
    return this.listarEventos().pipe(
      map(eventos => {
        const evento = eventos.find(item => item.id === eventoId);

        if (!evento) {
          throw new Error(`Evento ${eventoId} não encontrado.`);
        }

        return evento;
      })
    );
  }

  listarEventos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.apiUrl}/eventos`);
  }

  listarPessoas(): Observable<Pessoa[]> {
    return this.http.get<Pessoa[]>(`${this.apiUrl}/pessoas`);
  }

  listarTiosCarona(eventoId: number): Observable<TioCaronaEvento[]> {
    return this.http.get<TioCaronaEvento[]>(`${this.apiUrl}/eventos/${eventoId}/tios-carona`);
  }

  adicionarTioCarona(eventoId: number, request: TioCaronaEventoRequest): Observable<TioCaronaEvento> {
    return this.http.post<TioCaronaEvento>(
      `${this.apiUrl}/eventos/${eventoId}/tios-carona`,
      this.limpar(request)
    );
  }

  atualizarTioCarona(
    eventoId: number,
    tioCaronaEventoId: number,
    request: AtualizarTioCaronaEventoRequest
  ): Observable<TioCaronaEvento> {
    return this.http.patch<TioCaronaEvento>(
      `${this.apiUrl}/eventos/${eventoId}/tios-carona/${tioCaronaEventoId}`,
      this.limpar(request)
    );
  }

  listarDuplas(eventoId: number): Observable<DuplaTioCarona[]> {
    return this.http.get<DuplaTioCarona[]>(`${this.apiUrl}/eventos/${eventoId}/duplas`);
  }

  criarDupla(eventoId: number, request: DuplaTioCaronaRequest): Observable<DuplaTioCarona> {
    return this.http.post<DuplaTioCarona>(
      `${this.apiUrl}/eventos/${eventoId}/duplas`,
      this.limpar(request)
    );
  }

  atualizarDupla(
    eventoId: number,
    duplaId: number,
    request: AtualizarDuplaTioCaronaRequest
  ): Observable<DuplaTioCarona> {
    return this.http.patch<DuplaTioCarona>(
      `${this.apiUrl}/eventos/${eventoId}/duplas/${duplaId}`,
      this.limpar(request)
    );
  }

  inativarDupla(eventoId: number, duplaId: number): Observable<DuplaTioCarona> {
    return this.http.patch<DuplaTioCarona>(
      `${this.apiUrl}/eventos/${eventoId}/duplas/${duplaId}/inativar`,
      {}
    );
  }

  reativarDupla(eventoId: number, duplaId: number): Observable<DuplaTioCarona> {
    return this.http.patch<DuplaTioCarona>(
      `${this.apiUrl}/eventos/${eventoId}/duplas/${duplaId}/reativar`,
      {}
    );
  }

  listarSobrinhos(eventoId: number): Observable<Sobrinho[]> {
    return this.http.get<Sobrinho[]>(`${this.apiUrl}/eventos/${eventoId}/sobrinhos`);
  }

  criarSobrinho(eventoId: number, request: SobrinhoRequest): Observable<Sobrinho> {
    return this.http.post<Sobrinho>(
      `${this.apiUrl}/eventos/${eventoId}/sobrinhos`,
      this.limpar(request)
    );
  }

  atualizarSobrinho(eventoId: number, sobrinhoId: number, request: SobrinhoRequest): Observable<Sobrinho> {
    return this.http.put<Sobrinho>(
      `${this.apiUrl}/eventos/${eventoId}/sobrinhos/${sobrinhoId}`,
      this.limpar(request)
    );
  }

  /**
   * Endpoint suportado pelo backend atual para consultar os sobrinhos
   * vinculados a uma dupla específica.
   */
  listarSobrinhosDaDupla(eventoId: number, duplaId: number): Observable<SobrinhoDupla[]> {
    return this.http.get<SobrinhoDupla[]>(
      `${this.apiUrl}/eventos/${eventoId}/vinculos/duplas/${duplaId}/sobrinhos`
    );
  }

  vincularSobrinho(eventoId: number, request: VincularSobrinhoRequest): Observable<SobrinhoDupla> {
    return this.http.post<SobrinhoDupla>(
      `${this.apiUrl}/eventos/${eventoId}/vinculos`,
      this.limpar(request)
    );
  }

  listarVinculos(eventoId: number): Observable<SobrinhoDupla[]> {
    return this.http.get<SobrinhoDupla[]>(`${this.apiUrl}/eventos/${eventoId}/vinculos`);
  }

  removerVinculo(eventoId: number, vinculoId: number): Observable<SobrinhoDupla> {
    return this.http.patch<SobrinhoDupla>(
      `${this.apiUrl}/eventos/${eventoId}/vinculos/${vinculoId}/remover`,
      {}
    );
  }

  reativarVinculo(eventoId: number, vinculoId: number): Observable<SobrinhoDupla> {
    return this.http.patch<SobrinhoDupla>(
      `${this.apiUrl}/eventos/${eventoId}/vinculos/${vinculoId}/reativar`,
      {}
    );
  }

  trocarDuplaVinculo(
    eventoId: number,
    vinculoId: number,
    request: TrocarDuplaVinculoRequest
  ): Observable<SobrinhoDupla> {
    return this.http.patch<SobrinhoDupla>(
      `${this.apiUrl}/eventos/${eventoId}/vinculos/${vinculoId}/trocar-dupla`,
      this.limpar(request)
    );
  }

  private limpar<T extends object>(objeto: T): T {
    const copia: Record<string, unknown> = {};

    for (const [chave, valor] of Object.entries(objeto)) {
      copia[chave] = valor === '' ? undefined : valor;
    }

    return copia as T;
  }
}