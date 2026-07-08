import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule],
  template: `
    <h2 class="h4 mb-4">Dashboard</h2>
    <div class="row g-3">
      <div class="col-12 col-md-6 col-xl-3" *ngFor="let card of cards">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-body d-flex gap-3 align-items-center">
            <span class="ec-card-icon"><i [class]="card.icon"></i></span>
            <div>
              <div class="text-muted small">{{ card.label }}</div>
              <div class="h4 mb-0">{{ card.value }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="alert alert-info mt-4">
      <strong>Primeira entrega:</strong> esta tela ainda usa números fixos. No próximo bloco, ligaremos os indicadores ao backend.
    </div>
  `
})
export class DashboardComponent {
  cards = [
    { label: 'Eventos', value: '1', icon: 'fa-solid fa-calendar-days' },
    { label: 'Tios carona', value: '0', icon: 'fa-solid fa-van-shuttle' },
    { label: 'Sobrinhos', value: '0', icon: 'fa-solid fa-child-reaching' },
    { label: 'Cadernos pendentes', value: '0', icon: 'fa-solid fa-book' }
  ];
}
