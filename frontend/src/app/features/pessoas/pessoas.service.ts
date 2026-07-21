import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Pessoa, PessoaRequest } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class PessoasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/pessoas`;

  listar(): Observable<Pessoa[]> {
    return this.http.get<Pessoa[]>(this.apiUrl);
  }

  criar(payload: PessoaRequest): Observable<Pessoa> {
    return this.http.post<Pessoa>(this.apiUrl, payload);
  }

  atualizar(id: number, payload: PessoaRequest): Observable<Pessoa> {
    return this.http.put<Pessoa>(`${this.apiUrl}/${id}`, payload);
  }

  inativar(id: number): Observable<Pessoa> {
    return this.http.patch<Pessoa>(`${this.apiUrl}/${id}/inativar`, {});
  }

  reativar(id: number): Observable<Pessoa> {
    return this.http.patch<Pessoa>(`${this.apiUrl}/${id}/reativar`, {});
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
