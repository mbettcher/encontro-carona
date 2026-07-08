import { HttpClient} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Evento, EventoRequest, ParoquiaResumo } from '../../shared/models';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class EventosService {
  private readonly http = inject(HttpClient);
  private readonly eventosUrl = `${environment.apiUrl}/eventos`;
  private readonly paroquiasUrl = `${environment.apiUrl}/paroquias`;

  listar(): Observable<Evento[]> {
    return this.http.get<Evento[]>(this.eventosUrl);
  }

  criar(payload: EventoRequest): Observable<Evento> {
    return this.http.post<Evento>(this.eventosUrl, payload);
  }

  atualizar(id: number, payload: EventoRequest): Observable<Evento> {
    return this.http.put<Evento>(`${this.eventosUrl}/${id}`, payload);
  }

  listarParoquias(): Observable<ParoquiaResumo[]> {
    return this.http.get<ParoquiaResumo[]>(this.paroquiasUrl);
  }
}
