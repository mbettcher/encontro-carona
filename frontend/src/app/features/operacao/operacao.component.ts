import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-operacao',
  imports: [CommonModule],
  template: `
    <h2 class="h4 mb-3">Operação do Evento</h2>
    <div class="row g-3">
      <div class="col-12 col-md-6 col-xl-3" *ngFor="let item of itens">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-body">
            <div class="ec-card-icon mb-3"><i [class]="item.icon"></i></div>
            <h3 class="h6">{{ item.titulo }}</h3>
            <p class="text-muted small mb-0">{{ item.descricao }}</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OperacaoComponent {
  itens = [
    { titulo: 'Credenciais', icon: 'fa-solid fa-id-card', descricao: 'Gerar cartões dos tios carona com QR Code.' },
    { titulo: 'Check-in', icon: 'fa-solid fa-right-to-bracket', descricao: 'Registrar chegada da dupla e presença dos sobrinhos.' },
    { titulo: 'Caderno do Choro', icon: 'fa-solid fa-book', descricao: 'Controlar entrega por sobrinho.' },
    { titulo: 'Mapa', icon: 'fa-solid fa-map-location-dot', descricao: 'Roadmap: monitoramento por janela de horário do evento.' }
  ];
}
