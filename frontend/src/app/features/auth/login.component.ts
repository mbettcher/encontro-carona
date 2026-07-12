import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { AuthService } from '../../core/auth/auth.service';
import { extrairMensagemErro } from '../../shared/utils/http-error.util';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly carregando = signal(false);
  readonly mensagemErro = signal<string | null>(null);

  username = '';
  password = '';

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      void this.router.navigate(['/dashboard']);
    }

    if (this.route.snapshot.queryParamMap.get('motivo') === 'sessao-expirada') {
      this.mensagemErro.set('Sua sessão expirou. Faça login novamente.');
    }
  }

  entrar(): void {
    this.mensagemErro.set(null);

    if (!this.username.trim() || !this.password.trim()) {
      this.mensagemErro.set('Informe usuário e senha.');
      return;
    }

    this.carregando.set(true);

    this.auth.login({
      username: this.username,
      password: this.password
    })
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
          void this.router.navigateByUrl(returnUrl);
        },
        error: erro => {
          this.mensagemErro.set(extrairMensagemErro(erro));
        }
      });
  }
}
