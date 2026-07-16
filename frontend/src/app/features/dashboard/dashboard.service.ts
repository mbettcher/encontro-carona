import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

import {
  DashboardEventoOpcao,
  DashboardResumo,
  DashboardSobrinhoPresenca
} from './dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  carregarResumo(eventoId?: number | null): Observable<DashboardResumo> {
    let params = new HttpParams();

    if (eventoId) {
      params = params.set('eventoId', eventoId);
    }

    return this.http.get<DashboardResumo>(`${this.apiUrl}/dashboard/resumo`, { params });
  }

  listarEventos(): Observable<DashboardEventoOpcao[]> {
    return this.http.get<DashboardEventoOpcao[]>(`${this.apiUrl}/eventos`);
  }

  listarPresencasEvento(eventoId: number): Observable<DashboardSobrinhoPresenca[]> {
    return this.http.get<DashboardSobrinhoPresenca[]>(`${this.apiUrl}/eventos/${eventoId}/sobrinhos/presencas`);
  }
}
