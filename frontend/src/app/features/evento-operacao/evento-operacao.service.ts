import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';

import {
  DuplaTioCarona,
  Evento,
  Sobrinho,
  SobrinhoDupla,
  TioCaronaEvento,
  OperacaoPresencaSobrinho,
  CadernoChoro,
  CadernoChoroGeracaoResponse,
  CadernoChoroHistorico,
  StatusCadernoChoro,
  ModeloCarteirinhaCredencial,
  ModeloCrachaCredencial,
  ModeloEtiquetaQr,
  TipoCredencial,
  StatusCredencial,
  CredencialEvento,
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

  listarCadernos(eventoId: number): Observable<CadernoChoro[]> {
    return this.http.get<CadernoChoro[]>(`${this.apiUrl}/eventos/${eventoId}/cadernos`);
  }

  listarCredenciais(eventoId: number): Observable<CredencialEvento[]> {
    return this.http.get<CredencialEvento[]>(`${this.apiUrl}/eventos/${eventoId}/credenciais`);
  }

  listarHistoricoCaderno(eventoId: number, cadernoId: number): Observable<CadernoChoroHistorico[]> {
    return this.http.get<CadernoChoroHistorico[]>(`${this.apiUrl}/eventos/${eventoId}/cadernos/${cadernoId}/historico`);
  }

  baixarEtiquetasQrCode(
    eventoId: number,
    filtros: { modelo: ModeloEtiquetaQr; tipo?: TipoCredencial | null; status?: StatusCredencial | null }
  ): Observable<Blob> {
    let params = new HttpParams()
      .set('modelo', filtros.modelo);

    if (filtros.tipo) {
      params = params.set('tipo', filtros.tipo);
    }

    if (filtros.status) {
      params = params.set('status', filtros.status);
    }

    return this.http.get(
      `${this.apiUrl}/eventos/${eventoId}/relatorios/etiquetas-qr-code.pdf`,
      {
        params,
        responseType: 'blob'
      }
    );
  }

  baixarCrachasCredenciais(
    eventoId: number,
    filtros: { modelo: ModeloCrachaCredencial; tipo?: TipoCredencial | null; status?: StatusCredencial | null }
  ): Observable<Blob> {
    let params = new HttpParams()
      .set('modelo', filtros.modelo);

    if (filtros.tipo) {
      params = params.set('tipo', filtros.tipo);
    }

    if (filtros.status) {
      params = params.set('status', filtros.status);
    }

    return this.http.get(
      `${this.apiUrl}/eventos/${eventoId}/relatorios/crachas-credenciais.pdf`,
      {
        params,
        responseType: 'blob'
      }
    );
  }

  baixarCarteirinhasCredenciais(
    eventoId: number,
    filtros: { modelo: ModeloCarteirinhaCredencial; tipo?: TipoCredencial | null; status?: StatusCredencial | null }
  ): Observable<Blob> {
    let params = new HttpParams()
      .set('modelo', filtros.modelo);

    if (filtros.tipo) {
      params = params.set('tipo', filtros.tipo);
    }

    if (filtros.status) {
      params = params.set('status', filtros.status);
    }

    return this.http.get(
      `${this.apiUrl}/eventos/${eventoId}/relatorios/carteirinhas-credenciais.pdf`,
      {
        params,
        responseType: 'blob'
      }
    );
  }

  baixarRelatorioCadernosEquipes(
    eventoId: number,
    filtros?: { equipeId?: number | null; duplaId?: number | null; status?: StatusCadernoChoro | null }
  ): Observable<Blob> {
    let params = new HttpParams();

    if (filtros?.equipeId) {
      params = params.set('equipeId', String(filtros.equipeId));
    }

    if (filtros?.duplaId) {
      params = params.set('duplaId', String(filtros.duplaId));
    }

    if (filtros?.status) {
      params = params.set('status', filtros.status);
    }

    return this.http.get(
      `${this.apiUrl}/eventos/${eventoId}/relatorios/cadernos-equipes.pdf`,
      {
        params,
        responseType: 'blob'
      }
    );
  }

  baixarListaPresencaEncontristas(
    eventoId: number,
    filtros?: { somenteAtivos?: boolean; duplaId?: number | null }
  ): Observable<Blob> {
    let params = new HttpParams()
      .set('somenteAtivos', String(filtros?.somenteAtivos ?? true));

    if (filtros?.duplaId) {
      params = params.set('duplaId', String(filtros.duplaId));
    }

    return this.http.get(
      `${this.apiUrl}/eventos/${eventoId}/relatorios/lista-presenca-encontristas.pdf`,
      {
        params,
        responseType: 'blob'
      }
    );
  }

  baixarListaPresencaTiosCarona(
    eventoId: number,
    filtros?: { somenteAtivos?: boolean; duplaId?: number | null }
  ): Observable<Blob> {
    let params = new HttpParams()
      .set('somenteAtivos', String(filtros?.somenteAtivos ?? true));

    if (filtros?.duplaId) {
      params = params.set('duplaId', String(filtros.duplaId));
    }

    return this.http.get(
      `${this.apiUrl}/eventos/${eventoId}/relatorios/lista-presenca-tios-carona.pdf`,
      {
        params,
        responseType: 'blob'
      }
    );
  }

  gerarCadernos(eventoId: number): Observable<CadernoChoroGeracaoResponse> {
    return this.http.post<CadernoChoroGeracaoResponse>(`${this.apiUrl}/eventos/${eventoId}/cadernos/gerar`, {});
  }

  entregarCadernosADupla(
    eventoId: number,
    duplaId: number,
    observacao?: string
  ): Observable<CadernoChoro[]> {
    return this.http.post<CadernoChoro[]>(
      `${this.apiUrl}/eventos/${eventoId}/cadernos/duplas/${duplaId}/entregar-a-dupla`,
      { observacao: observacao?.trim() || undefined }
    );
  }

  receberCadernosDaDupla(
    eventoId: number,
    duplaId: number,
    observacao?: string
  ): Observable<CadernoChoro[]> {
    return this.http.post<CadernoChoro[]>(
      `${this.apiUrl}/eventos/${eventoId}/cadernos/duplas/${duplaId}/receber-da-dupla`,
      { observacao: observacao?.trim() || undefined }
    );
  }

  conferirCaderno(
    eventoId: number,
    cadernoId: number,
    observacao?: string
  ): Observable<CadernoChoro> {
    return this.operarCaderno(eventoId, cadernoId, 'conferir', observacao);
  }

  anexarCadernoAoKit(
    eventoId: number,
    cadernoId: number,
    observacao?: string
  ): Observable<CadernoChoro> {
    return this.operarCaderno(eventoId, cadernoId, 'anexar-ao-kit', observacao);
  }

  entregarCadernoAoSobrinho(
    eventoId: number,
    cadernoId: number,
    observacao?: string
  ): Observable<CadernoChoro> {
    return this.operarCaderno(eventoId, cadernoId, 'entregar-ao-sobrinho', observacao);
  }

  marcarCadernoPerdido(
    eventoId: number,
    cadernoId: number,
    observacao?: string
  ): Observable<CadernoChoro> {
    return this.operarCaderno(eventoId, cadernoId, 'perdido', observacao);
  }

  marcarCadernoSubstituido(
    eventoId: number,
    cadernoId: number,
    observacao?: string
  ): Observable<CadernoChoro> {
    return this.operarCaderno(eventoId, cadernoId, 'substituido', observacao);
  }

  cancelarCaderno(
    eventoId: number,
    cadernoId: number,
    observacao?: string
  ): Observable<CadernoChoro> {
    return this.operarCaderno(eventoId, cadernoId, 'cancelado', observacao);
  }

  private operarCaderno(
    eventoId: number,
    cadernoId: number,
    operacao: string,
    observacao?: string
  ): Observable<CadernoChoro> {
    return this.http.post<CadernoChoro>(
      `${this.apiUrl}/eventos/${eventoId}/cadernos/${cadernoId}/${operacao}`,
      { observacao: observacao?.trim() || undefined }
    );
  }

  registrarCheckinPorCodigo(eventoId: number, codigoIdentificacao: string): Observable<TioCaronaEvento> {
    return this.http.post<TioCaronaEvento>(`${this.apiUrl}/eventos/${eventoId}/tios-carona/operacao/check-in`, { codigoIdentificacao });
  }

  registrarCheckoutPorCodigo(eventoId: number, codigoIdentificacao: string): Observable<TioCaronaEvento> {
    return this.http.post<TioCaronaEvento>(`${this.apiUrl}/eventos/${eventoId}/tios-carona/operacao/checkout`, { codigoIdentificacao });
  }

  registrarCheckinManual(eventoId: number, tioCaronaEventoId: number): Observable<TioCaronaEvento> {
    return this.http.post<TioCaronaEvento>(`${this.apiUrl}/eventos/${eventoId}/tios-carona/${tioCaronaEventoId}/operacao/manual/check-in`, {});
  }

  registrarCheckoutManual(eventoId: number, tioCaronaEventoId: number): Observable<TioCaronaEvento> {
    return this.http.post<TioCaronaEvento>(`${this.apiUrl}/eventos/${eventoId}/tios-carona/${tioCaronaEventoId}/operacao/manual/checkout`, {});
  }

  registrarPresencaSobrinho(eventoId: number, sobrinhoId: number, operacao: OperacaoPresencaSobrinho, observacao?: string): Observable<Sobrinho> {
    return this.http.patch<Sobrinho>(
      `${this.apiUrl}/eventos/${eventoId}/sobrinhos/${sobrinhoId}/presenca`,
      {
        operacao,
        observacao: observacao?.trim() || undefined
      }
    );
  }

  registrarPresencaSobrinhoPorCodigo(eventoId: number, codigoIdentificacao: string, operacao: OperacaoPresencaSobrinho, observacao?: string): Observable<Sobrinho> {
    return this.http.post<Sobrinho>(
      `${this.apiUrl}/eventos/${eventoId}/sobrinhos/presenca/credencial`,
      {
        codigoIdentificacao: codigoIdentificacao.trim(),
        operacao,
        observacao: observacao?.trim() || undefined
      }
    );
  }
}
