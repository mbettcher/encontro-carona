import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  readonly auth = inject(AuthService);

  @Input({ required: true })
  sidebarCollapsed = false;

  @Output()
  readonly toggleSidebar = new EventEmitter<void>();

  @Output()
  readonly openMobileSidebar = new EventEmitter<void>();

  sair(): void {
    this.auth.logout();
  }
}
