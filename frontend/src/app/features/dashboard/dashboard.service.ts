import { Injectable } from '@angular/core';

export interface DashboardCard {
  label: string;
  value: string;
  icon: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  obterCardsIniciais(): DashboardCard[] {
    return [
      { label: 'Eventos', value: '1', icon: 'fa-solid fa-calendar-days' },
      { label: 'Tios carona', value: '0', icon: 'fa-solid fa-van-shuttle' },
      { label: 'Encontristas', value: '0', icon: 'fa-solid fa-child-reaching' },
      { label: 'Cadernos pendentes', value: '0', icon: 'fa-solid fa-book' }
    ];
  }
}
