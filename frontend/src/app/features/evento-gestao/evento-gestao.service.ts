import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';

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

  listarDuplas(eventoId: number): Observable<DuplaTioCarona[]> {
    return this.http.get<DuplaTioCarona[]>(`${this.apiUrl}/eventos/${eventoId}/duplas`);
  }

  criarDupla(eventoId: number, request: DuplaTioCaronaRequest): Observable<DuplaTioCarona> {
    return this.http.post<DuplaTioCarona>(
      `${this.apiUrl}/eventos/${eventoId}/duplas`,
      this.limpar(request)
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

  /**
   * O backend atual ainda não expõe GET /eventos/{eventoId}/vinculos.
   *
   * Então montamos a lista geral de vínculos a partir das duplas:
   * 1. GET /eventos/{eventoId}/duplas
   * 2. Para cada dupla: GET /eventos/{eventoId}/vinculos/duplas/{duplaId}/sobrinhos
   * 3. Junta tudo em uma lista única.
   */
  listarVinculos(eventoId: number): Observable<SobrinhoDupla[]> {
    return this.listarDuplas(eventoId).pipe(
      switchMap(duplas => {
        if (duplas.length === 0) {
          return of([]);
        }

        const requisicoes = duplas.map(dupla =>
          this.listarSobrinhosDaDupla(eventoId, dupla.id)
        );

        return forkJoin(requisicoes).pipe(
          map(resultados => resultados.flat())
        );
      })
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