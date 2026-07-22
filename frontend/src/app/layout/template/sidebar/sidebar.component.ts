import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { APP_BUILD_INFO } from 'src/app/core/app-version';

interface SidebarItem {
  label: string;
  icon: string;
  route: string;
  visible: () => boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  readonly auth = inject(AuthService);
  readonly buildInfo = APP_BUILD_INFO;

  @Input({ required: true })
  collapsed = false;

  @Output()
  readonly navigate = new EventEmitter<void>();

  readonly itens: SidebarItem[] = [
    {
      label: 'Dashboard',
      icon: 'fa-solid fa-chart-line',
      route: '/dashboard',
      visible: () => true
    },
    {
      label: 'Paróquias/Comunidades',
      icon: 'fa-solid fa-church',
      route: '/paroquias',
      visible: () => this.auth.podeVerCadastros()
    },
    {
      label: 'Eventos',
      icon: 'fa-solid fa-calendar-days',
      route: '/eventos',
      visible: () => this.auth.podeVerCadastros()
    },
    {
      label: 'Pessoas',
      icon: 'fa-solid fa-users',
      route: '/pessoas',
      visible: () => this.auth.podeVerCadastros()
    },
    {
      label: 'Usuários',
      icon: 'fa-solid fa-user-gear',
      route: '/administracao/usuarios',
      visible: () => this.auth.podeAdministrar()
    },
    {
      label: 'Sobre / Versão',
      icon: 'fa-solid fa-circle-info',
      route: '/sobre-versao',
      visible: () => true
    }
  ];

  itensVisiveis(): SidebarItem[] {
    return this.itens.filter((item) => item.visible());
  }
}
