import { Injectable } from '@angular/core';

export interface OperacaoItem {
  titulo: string;
  icon: string;
  descricao: string;
}

@Injectable({ providedIn: 'root' })
export class OperacaoService {
  obterItens(): OperacaoItem[] {
    return [
      { titulo: 'Credenciais', icon: 'fa-solid fa-id-card', descricao: 'Gerar cartões dos tios carona com QR Code.' },
      { titulo: 'Check-in', icon: 'fa-solid fa-right-to-bracket', descricao: 'Registrar chegada da dupla e presença dos sobrinhos.' },
      { titulo: 'Caderno do Choro', icon: 'fa-solid fa-book', descricao: 'Controlar entrega por sobrinho.' },
      { titulo: 'Mapa', icon: 'fa-solid fa-map-location-dot', descricao: 'Roadmap: monitoramento por janela de horário do evento.' }
    ];
  }
}
