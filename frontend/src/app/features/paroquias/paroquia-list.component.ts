import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { Paroquia } from '../../shared/models';

@Component({
  standalone: true,
  selector: 'app-paroquias-list',
  imports: [CommonModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h2 class="h4 mb-1">Paróquias</h2>
        <div class="text-muted small">Listagem inicial consumindo a API REST.</div>
      </div>
      <button class="btn btn-primary" disabled><i class="fa-solid fa-plus me-1"></i>Novo</button>
    </div>

    <div class="card shadow-sm border-0">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light"><tr><th>nome</th><th>cidade</th><th>uf</th><th>responsavel</th></tr></thead>
          <tbody>
            <tr *ngFor="let item of itens()"><td>{{ item.nome }}</td><td>{{ item.cidade }}</td><td>{{ item.uf }}</td><td>{{ item.responsavel }}</td></tr>
            <tr *ngIf="!carregando() && itens().length === 0"><td colspan="4" class="text-center text-muted py-4">Nenhum registro encontrado.</td></tr>
            <tr *ngIf="carregando()"><td colspan="4" class="text-center text-muted py-4">Carregando...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ParoquiaListComponent implements OnInit {
  itens = signal<Paroquia[]>([]);
  carregando = signal(false);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.carregando.set(true);
    this.api.listarParoquias().subscribe({
      next: dados => this.itens.set(dados),
      error: () => this.itens.set([]),
      complete: () => this.carregando.set(false)
    });
  }
}
