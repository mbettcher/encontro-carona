import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from './api.config';
import { Evento, Paroquia, Pessoa } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  listarParoquias() {
    return this.http.get<Paroquia[]>(`${API_BASE_URL}/paroquias`);
  }

  listarEventos() {
    return this.http.get<Evento[]>(`${API_BASE_URL}/eventos`);
  }

  listarPessoas(busca?: string) {
    const query = busca ? `?busca=${encodeURIComponent(busca)}` : '';
    return this.http.get<Pessoa[]>(`${API_BASE_URL}/pessoas${query}`);
  }
}
