import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';

import { AuthService } from '../../core/auth/auth.service';
import { extrairMensagemErro } from '../../shared/utils/http-error.util';

@Component({
  selector: 'app-alterar-senha',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    InputTextModule
  ],
  templateUrl: './alterar-senha.component.html',
  styleUrl: './alterar-senha.component.scss'
})
export class AlterarSenhaComponent {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly salvando = signal(false);

  readonly form = this.fb.nonNullable.group({
    senhaAtual: ['', [Validators.required, Validators.maxLength(72)]],
    novaSenha: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirmacaoSenha: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]]
  });

  alterarSenha(): void {
    if (this.salvando()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.messageService.add({
        severity: 'warn',
        summary: 'Formulário incompleto',
        detail: 'Preencha todos os campos antes de alterar a senha.',
        life: 4000
      });

      return;
    }

    const valor = this.form.getRawValue();

    if (valor.novaSenha !== valor.confirmacaoSenha) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Confirmação inválida',
        detail: 'A confirmação da nova senha não confere.',
        life: 5000
      });

      return;
    }

    if (valor.senhaAtual === valor.novaSenha) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Senha inválida',
        detail: 'A nova senha deve ser diferente da senha atual.',
        life: 5000
      });

      return;
    }

    if (!this.senhaForte(valor.novaSenha)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Senha fraca',
        detail: 'Use ao menos 8 caracteres, com maiúscula, minúscula, número e caractere especial.',
        life: 6000
      });

      return;
    }

    this.salvando.set(true);

    this.auth.alterarSenha(valor)
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Senha alterada',
            detail: 'Sua senha foi alterada com sucesso.',
            life: 4000
          });

          this.form.reset();
          void this.router.navigateByUrl('/dashboard');
        },
        error: erro => {
          console.error('Erro ao alterar senha', erro);

          this.messageService.add({
            severity: 'error',
            summary: 'Erro ao alterar senha',
            detail: extrairMensagemErro(erro) || 'Não foi possível alterar sua senha.',
            life: 6000
          });
        }
      });
  }

  campoInvalido(campo: 'senhaAtual' | 'novaSenha' | 'confirmacaoSenha'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.dirty || control.touched);
  }

  private senhaForte(senha: string): boolean {
    return senha.length >= 8 &&
      /[A-Z]/.test(senha) &&
      /[a-z]/.test(senha) &&
      /\d/.test(senha) &&
      /[^A-Za-z0-9]/.test(senha);
  }
}
