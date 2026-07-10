import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { environment } from 'src/environments/environment';

import {
  CadernoChoro,
  CredencialEvento,
  DuplaTioCarona,
  Evento,
  Pessoa,
  Sobrinho,
  SobrinhoDupla,
  TioCaronaEvento
} from '../../shared/models';

export interface DashboardBaseResumo {
  eventos: Evento[];
  pessoas: Pessoa[];
}

export interface DashboardEventoResumo {
  eventoId: number;
  tiosCarona: TioCaronaEvento[];
  duplas: DuplaTioCarona[];
  encontristas: Sobrinho[];
  vinculos: SobrinhoDupla[];
  cadernos: CadernoChoro[];
  credenciais: CredencialEvento[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  carregarBase(): Observable<DashboardBaseResumo> {
    return forkJoin({
      eventos: this.safeArray<Evento>(this.http.get<Evento[]>(`${this.apiUrl}/eventos`)),
      pessoas: this.safeArray<Pessoa>(this.http.get<Pessoa[]>(`${this.apiUrl}/pessoas`))
    });
  }

  carregarEvento(eventoId: number): Observable<DashboardEventoResumo> {
    return forkJoin({
      tiosCarona: this.safeArray<TioCaronaEvento>(
        this.http.get<TioCaronaEvento[]>(`${this.apiUrl}/eventos/${eventoId}/tios-carona`)
      ),
      duplas: this.safeArray<DuplaTioCarona>(
        this.http.get<DuplaTioCarona[]>(`${this.apiUrl}/eventos/${eventoId}/duplas`)
      ),
      encontristas: this.safeArray<Sobrinho>(
        this.http.get<Sobrinho[]>(`${this.apiUrl}/eventos/${eventoId}/sobrinhos`)
      ),
      vinculos: this.safeArray<SobrinhoDupla>(
        this.http.get<SobrinhoDupla[]>(`${this.apiUrl}/eventos/${eventoId}/vinculos`)
      ),
      cadernos: this.safeArray<CadernoChoro>(
        this.http.get<CadernoChoro[]>(`${this.apiUrl}/eventos/${eventoId}/cadernos`)
      ),
      credenciais: this.safeArray<CredencialEvento>(
        this.http.get<CredencialEvento[]>(`${this.apiUrl}/eventos/${eventoId}/credenciais`)
      )
    }).pipe(
      map(resultado => ({
        eventoId,
        ...resultado
      }))
    );
  }

  private safeArray<T>(source$: Observable<T[]>): Observable<T[]> {
    return source$.pipe(
      catchError(erro => {
        console.warn('Dashboard: falha ao carregar indicador. O card será exibido com zero.', erro);
        return of([] as T[]);
      })
    );
  }
}
