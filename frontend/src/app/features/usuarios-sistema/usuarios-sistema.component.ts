import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { AuthService } from '../../core/auth/auth.service';
import { PerfilUsuario } from '../../core/auth/auth.models';
import { extrairMensagemErro } from '../../shared/utils/http-error.util';
import {
  UsuarioSistema,
  UsuariosSistemaService
} from './usuarios-sistema.service';

interface PerfilOpcao {
  label: string;
  value: PerfilUsuario;
}

@Component({
  selector: 'app-usuarios-sistema',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule
  ],
  templateUrl: './usuarios-sistema.component.html',
  styleUrl: './usuarios-sistema.component.scss'
})
export class UsuariosSistemaComponent implements OnInit {
  readonly seguranca = inject(AuthService);

  private readonly service = inject(UsuariosSistemaService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly usuarios = signal<UsuarioSistema[]>([]);
  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly usuarioEmEdicao = signal<UsuarioSistema | null>(null);
  readonly usuarioResetSenha = signal<UsuarioSistema | null>(null);
  readonly resetandoSenha = signal(false);

  novaSenha = '';

  readonly perfilOpcoes: PerfilOpcao[] = [
    { label: 'Administrador', value: 'ADMIN' },
    { label: 'Operador administrador', value: 'OPERADOR_ADMIN' },
    { label: 'Operador leitura', value: 'OPERADOR_LEITURA' },
    { label: 'Somente leitura', value: 'SOMENTE_LEITURA' }
  ];

  readonly tituloFormulario = computed(() =>
    this.usuarioEmEdicao() ? 'Editar usuário' : 'Novo usuário'
  );

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    username: ['', [Validators.required, Validators.maxLength(120)]],
    senha: ['', [Validators.maxLength(72)]],
    perfil: ['OPERADOR_LEITURA' as PerfilUsuario, [Validators.required]]
  });

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  carregarUsuarios(): void {
    this.carregando.set(true);

    this.service.listar().subscribe({
      next: usuarios => {
        this.usuarios.set(usuarios);
        this.carregando.set(false);
      },
      error: erro => {
        console.error('Erro ao carregar usuários', erro);

        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao carregar',
          detail: 'Não foi possível carregar os usuários do sistema.',
          life: 5000
        });

        this.carregando.set(false);
      }
    });
  }

  salvar(): void {
    if (!this.seguranca.podeAdministrar()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acesso negado',
        detail: 'Apenas administradores podem gerenciar usuários.',
        life: 4000
      });
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.messageService.add({
        severity: 'warn',
        summary: 'Formulário incompleto',
        detail: 'Preencha os campos obrigatórios antes de salvar.',
        life: 4000
      });

      return;
    }

    const valor = this.form.getRawValue();
    const usuarioAtual = this.usuarioEmEdicao();

    if (!usuarioAtual && valor.senha.trim().length < 8) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Senha inválida',
        detail: 'Informe uma senha inicial com pelo menos 8 caracteres.',
        life: 5000
      });

      return;
    }

    this.salvando.set(true);

    const requisicao = usuarioAtual
      ? this.service.atualizar(usuarioAtual.id, {
        nome: valor.nome.trim(),
        perfil: valor.perfil
      })
      : this.service.criar({
        nome: valor.nome.trim(),
        username: valor.username.trim().toLowerCase(),
        senha: valor.senha,
        perfil: valor.perfil
      });

    requisicao.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: usuarioAtual ? 'Usuário atualizado com sucesso.' : 'Usuário criado com sucesso.',
          life: 4000
        });

        this.salvando.set(false);
        this.limparFormulario();
        this.carregarUsuarios();
      },
      error: erro => {
        console.error('Erro ao salvar usuário', erro);

        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao salvar',
          detail: extrairMensagemErro(erro) || 'Não foi possível salvar o usuário.',
          life: 6000
        });

        this.salvando.set(false);
      }
    });
  }

  editar(usuario: UsuarioSistema): void {
    this.usuarioEmEdicao.set(usuario);

    this.form.patchValue({
      nome: usuario.nome,
      username: usuario.username,
      senha: '',
      perfil: usuario.perfil
    });

    this.form.controls.username.disable({ emitEvent: false });
  }

  cancelarEdicao(): void {
    this.limparFormulario();
  }

  limparFormulario(): void {
    this.usuarioEmEdicao.set(null);
    this.form.reset({
      nome: '',
      username: '',
      senha: '',
      perfil: 'OPERADOR_LEITURA'
    });
    this.form.controls.username.enable({ emitEvent: false });
  }

  confirmarAtivacao(usuario: UsuarioSistema): void {
    this.confirmationService.confirm({
      header: usuario.ativo ? 'Desativar usuário' : 'Ativar usuário',
      message: usuario.ativo
        ? `Deseja desativar o usuário ${usuario.nome}?`
        : `Deseja ativar o usuário ${usuario.nome}?`,
      icon: 'fa-solid fa-triangle-exclamation',
      acceptLabel: usuario.ativo ? 'Desativar' : 'Ativar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: usuario.ativo ? 'p-button-danger' : 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => this.alterarStatus(usuario)
    });
  }

  prepararResetSenha(usuario: UsuarioSistema): void {
    this.usuarioResetSenha.set(usuario);
    this.novaSenha = '';
  }

  cancelarResetSenha(): void {
    this.usuarioResetSenha.set(null);
    this.novaSenha = '';
  }

  resetarSenha(): void {
    const usuario = this.usuarioResetSenha();

    if (!usuario || this.resetandoSenha()) {
      return;
    }

    if (this.novaSenha.length < 8) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Senha inválida',
        detail: 'Informe uma senha com pelo menos 8 caracteres.',
        life: 5000
      });

      return;
    }

    this.resetandoSenha.set(true);

    this.service.resetarSenha(usuario.id, { novaSenha: this.novaSenha })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Senha resetada',
            detail: `Senha do usuário ${usuario.nome} alterada com sucesso.`,
            life: 5000
          });

          this.resetandoSenha.set(false);
          this.cancelarResetSenha();
          this.carregarUsuarios();
        },
        error: erro => {
          console.error('Erro ao resetar senha', erro);

          this.messageService.add({
            severity: 'error',
            summary: 'Erro ao resetar senha',
            detail: extrairMensagemErro(erro) || 'Não foi possível resetar a senha.',
            life: 6000
          });

          this.resetandoSenha.set(false);
        }
      });
  }

  labelPerfil(perfil: PerfilUsuario): string {
    return this.seguranca.labelPerfil(perfil);
  }

  severityPerfil(perfil: PerfilUsuario): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (perfil) {
      case 'ADMIN':
        return 'danger';
      case 'OPERADOR_ADMIN':
        return 'success';
      case 'OPERADOR_LEITURA':
        return 'info';
      case 'SOMENTE_LEITURA':
        return 'secondary';
    }
  }

  private alterarStatus(usuario: UsuarioSistema): void {
    const requisicao = usuario.ativo
      ? this.service.desativar(usuario.id)
      : this.service.ativar(usuario.id);

    requisicao.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: usuario.ativo ? 'Usuário desativado com sucesso.' : 'Usuário ativado com sucesso.',
          life: 4000
        });

        this.carregarUsuarios();
      },
      error: erro => {
        console.error('Erro ao alterar status do usuário', erro);

        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao alterar status',
          detail: extrairMensagemErro(erro) || 'Não foi possível alterar o status do usuário.',
          life: 6000
        });
      }
    });
  }
}
