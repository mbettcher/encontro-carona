import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { FooterComponent } from './template/footer/footer.component';
import { NavbarComponent } from './template/navbar/navbar.component';
import { SidebarComponent } from './template/sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    SidebarComponent,
    FooterComponent
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  private readonly storageKey = 'encontro-carona:sidebar-collapsed';

  readonly sidebarCollapsed = signal(this.carregarEstadoRecolhido());
  readonly mobileSidebarOpen = signal(false);

  toggleSidebar(): void {
    const proximo = !this.sidebarCollapsed();

    this.sidebarCollapsed.set(proximo);
    localStorage.setItem(this.storageKey, String(proximo));
  }

  abrirSidebarMobile(): void {
    this.mobileSidebarOpen.set(true);
  }

  fecharSidebarMobile(): void {
    this.mobileSidebarOpen.set(false);
  }

  private carregarEstadoRecolhido(): boolean {
    return localStorage.getItem(this.storageKey) === 'true';
  }
}
