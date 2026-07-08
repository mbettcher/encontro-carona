import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DashboardService } from './dashboard.service';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);

  cards = this.dashboardService.obterCardsIniciais();
}
