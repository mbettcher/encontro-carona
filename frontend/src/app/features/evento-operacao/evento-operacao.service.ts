import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';

import {
  DuplaTioCarona,
  Evento,
  Sobrinho,
  SobrinhoDupla,
  TioCaronaEvento
} from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class EventoOperacaoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

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

  listarTiosCarona(eventoId: number): Observable<TioCaronaEvento[]> {
    return this.http.get<TioCaronaEvento[]>(`${this.apiUrl}/eventos/${eventoId}/tios-carona`);
  }

  listarDuplas(eventoId: number): Observable<DuplaTioCarona[]> {
    return this.http.get<DuplaTioCarona[]>(`${this.apiUrl}/eventos/${eventoId}/duplas`);
  }

  listarSobrinhos(eventoId: number): Observable<Sobrinho[]> {
    return this.http.get<Sobrinho[]>(`${this.apiUrl}/eventos/${eventoId}/sobrinhos`);
  }

  listarSobrinhosDaDupla(eventoId: number, duplaId: number): Observable<SobrinhoDupla[]> {
    return this.http.get<SobrinhoDupla[]>(
      `${this.apiUrl}/eventos/${eventoId}/vinculos/duplas/${duplaId}/sobrinhos`
    );
  }

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

  registrarCheckinPorCodigo(eventoId: number, codigoIdentificacao: string): Observable<TioCaronaEvento> {
    return this.http.post<TioCaronaEvento>(`${this.apiUrl}/eventos/${eventoId}/tios-carona/operacao/check-in`, { codigoIdentificacao });
  }

  registrarCheckoutPorCodigo(eventoId: number, codigoIdentificacao: string): Observable<TioCaronaEvento> {
    return this.http.post<TioCaronaEvento>(`${this.apiUrl}/eventos/${eventoId}/tios-carona/operacao/checkout`, { codigoIdentificacao } );
  }

  registrarCheckinManual(eventoId: number, tioCaronaEventoId: number): Observable<TioCaronaEvento> {
    return this.http.post<TioCaronaEvento>(`${this.apiUrl}/eventos/${eventoId}/tios-carona/${tioCaronaEventoId}/operacao/check-in`, {});
  }

  registrarCheckoutManual(eventoId: number, tioCaronaEventoId: number): Observable<TioCaronaEvento> {
    return this.http.post<TioCaronaEvento>(`${this.apiUrl}/eventos/${eventoId}/tios-carona/${tioCaronaEventoId}/operacao/checkout`, {});
  }
}