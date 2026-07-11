import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
    CredencialEvento,
    CredencialGeracaoResponse,
    TipoCredencial
} from '../../shared/models';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class EventoCredenciaisService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl;

    listar(eventoId: number, tipo?: TipoCredencial | null): Observable<CredencialEvento[]> {
        let params = new HttpParams();

        if (tipo) {
            params = params.set('tipo', tipo);
        }

        return this.http.get<CredencialEvento[]>(
            `${this.apiUrl}/eventos/${eventoId}/credenciais`,
            { params }
        );
    }

    gerarTodas(eventoId: number): Observable<CredencialGeracaoResponse> {
        return this.http.post<CredencialGeracaoResponse>(
            `${this.apiUrl}/eventos/${eventoId}/credenciais/gerar`,
            {}
        );
    }

    gerarTiosCarona(eventoId: number): Observable<CredencialGeracaoResponse> {
        return this.http.post<CredencialGeracaoResponse>(
            `${this.apiUrl}/eventos/${eventoId}/credenciais/gerar/tios-carona`,
            {}
        );
    }

    gerarSobrinhos(eventoId: number): Observable<CredencialGeracaoResponse> {
        return this.http.post<CredencialGeracaoResponse>(
            `${this.apiUrl}/eventos/${eventoId}/credenciais/gerar/sobrinhos`,
            {}
        );
    }

    inativar(eventoId: number, credencialId: number): Observable<CredencialEvento> {
        return this.http.patch<CredencialEvento>(
            `${this.apiUrl}/eventos/${eventoId}/credenciais/${credencialId}/inativar`,
            {}
        );
    }

    reativar(eventoId: number, credencialId: number): Observable<CredencialEvento> {
        return this.http.patch<CredencialEvento>(
            `${this.apiUrl}/eventos/${eventoId}/credenciais/${credencialId}/reativar`,
            {}
        );
    }

    cancelar(eventoId: number, credencialId: number): Observable<CredencialEvento> {
        return this.http.patch<CredencialEvento>(
            `${this.apiUrl}/eventos/${eventoId}/credenciais/${credencialId}/cancelar`,
            {}
        );
    }

    reemitir(eventoId: number, credencialId: number): Observable<CredencialEvento> {
        return this.http.patch<CredencialEvento>(
            `${this.apiUrl}/eventos/${eventoId}/credenciais/${credencialId}/reemitir`,
            {}
        );
    }
}