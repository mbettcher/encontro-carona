import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Paroquia, ParoquiaRequest } from '../../shared/models';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ParoquiasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/paroquias`;

  listar(): Observable<Paroquia[]> {
    return this.http.get<Paroquia[]>(this.apiUrl);
  }

  criar(payload: ParoquiaRequest): Observable<Paroquia> {
    return this.http.post<Paroquia>(this.apiUrl, payload);
  }

  atualizar(id: number, payload: ParoquiaRequest): Observable<Paroquia> {
    return this.http.put<Paroquia>(`${this.apiUrl}/${id}`, payload);
  }
}
