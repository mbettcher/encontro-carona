import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

import { AuthService } from './core/auth/auth.service';

type PerfilUsuario =
  | 'ADMIN'
  | 'OPERADOR_ADMIN'
  | 'OPERADOR_LEITURA'
  | 'SOMENTE_LEITURA';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ToastModule,
    ConfirmDialogModule,
    ButtonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly auth: AuthService = inject(AuthService);

  sair(): void {
    this.auth.logout();
  }

  podeVerCadastros(): boolean {
    const perfil = this.perfilAtual();

    return perfil === 'ADMIN' ||
      perfil === 'OPERADOR_ADMIN' ||
      perfil === 'OPERADOR_LEITURA';
  }

  labelPerfil(perfil: string | null | undefined): string {
    switch (perfil) {
      case 'ADMIN':
        return 'Administrador';

      case 'OPERADOR_ADMIN':
        return 'Operador administrador';

      case 'OPERADOR_LEITURA':
        return 'Operador leitura';

      case 'SOMENTE_LEITURA':
        return 'Somente leitura';

      default:
        return 'Perfil não identificado';
    }
  }

  private perfilAtual(): PerfilUsuario | null {
    const usuario = this.auth.usuario();

    if (!usuario?.perfil) {
      return null;
    }

    const perfil = String(usuario.perfil).toUpperCase();

    if (
      perfil === 'ADMIN' ||
      perfil === 'OPERADOR_ADMIN' ||
      perfil === 'OPERADOR_LEITURA' ||
      perfil === 'SOMENTE_LEITURA'
    ) {
      return perfil;
    }

    return null;
  }
}