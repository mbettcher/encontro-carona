import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { Paroquia, ParoquiaRequest } from '../../shared/models';
import { CustomFormHelperService } from '../../shared/services/custom-form-helper.service';
import { AuthService } from '../../core/auth/auth.service';
import { TelefoneMaskDirective } from '../../shared/directives/telefone-mask.directive';
import { ParoquiasService } from './paroquias.service';

@Component({
  selector: 'app-paroquias',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    InputTextModule,
    TableModule,
    TagModule,
    TelefoneMaskDirective,
    TooltipModule
  ],
  templateUrl: './paroquias.component.html',
  providers: [ConfirmationService],
  styleUrl: './paroquias.component.scss'
})
export class ParoquiasComponent implements OnInit {
  readonly seguranca = inject(AuthService);

  private readonly service = inject(ParoquiasService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly customFormHelper = inject(CustomFormHelperService);

  readonly paroquias = signal<Paroquia[]>([]);
  readonly filtroTexto = signal('');
  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly paroquiaEmEdicao = signal<Paroquia | null>(null);

  readonly paroquiasFiltradas = computed(() => {
    const termo = this.normalizarBusca(this.filtroTexto());

    if (!termo) {
      return this.paroquias();
    }

    return this.paroquias().filter(paroquia => [
      paroquia.nome,
      paroquia.endereco,
      paroquia.cidade,
      paroquia.uf,
      paroquia.telefone,
      paroquia.email,
      paroquia.responsavel
    ].some(valor => this.normalizarBusca(valor).includes(termo)));
  });

  readonly tituloFormulario = computed(() =>
    this.paroquiaEmEdicao() ? 'Editar paróquia/comunidade' : 'Nova paróquia/comunidade'
  );

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(160)]],
    endereco: ['', [Validators.maxLength(220)]],
    cidade: ['', [Validators.maxLength(120)]],
    uf: ['', [Validators.maxLength(2)]],
    telefone: ['', [Validators.maxLength(30)]],
    email: ['', [Validators.email, Validators.maxLength(160)]],
    responsavel: ['', [Validators.maxLength(160)]]
  });

  ngOnInit(): void {
    this.carregarParoquias();
  }

  carregarParoquias(): void {
    this.carregando.set(true);

    this.service.listar().subscribe({
      next: paroquias => {
        this.paroquias.set(paroquias);
        this.carregando.set(false);
      },
      error: erro => {
        console.error('Erro ao carregar Paróquia/Comunidade', erro);

        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao carregar',
          detail: 'Não foi possível carregar as Paróquia/Comunidade.',
          life: 5000
        });

        this.carregando.set(false);
      }
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.messageService.add({
        severity: 'warn',
        summary: 'Formulário incompleto',
        detail: 'Informe ao menos o nome da paróquia/comunidade e corrija os campos inválidos.',
        life: 4500
      });

      return;
    }

    this.formatarCamposTexto();

    const payload = this.montarPayload();
    const paroquiaAtual = this.paroquiaEmEdicao();

    this.salvando.set(true);

    const requisicao = paroquiaAtual
      ? this.service.atualizar(paroquiaAtual.id, payload)
      : this.service.criar(payload);

    requisicao.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: paroquiaAtual ? 'Paróquia/Comunidade atualizada com sucesso.' : 'Paróquia/Comunidade cadastrada com sucesso.',
          life: 4000
        });

        this.salvando.set(false);
        this.limparFormulario();
        this.carregarParoquias();
      },
      error: erro => {
        console.error('Erro ao salvar paróquia/comunidade', erro);

        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao salvar',
          detail: 'Não foi possível salvar a paróquia/comunidade. Confira os dados informados.',
          life: 6000
        });

        this.salvando.set(false);
      }
    });
  }

  editar(paroquia: Paroquia): void {
    this.paroquiaEmEdicao.set(paroquia);

    this.form.patchValue({
      nome: paroquia.nome,
      endereco: paroquia.endereco ?? '',
      cidade: paroquia.cidade ?? '',
      uf: paroquia.uf ?? '',
      telefone: paroquia.telefone ?? '',
      email: paroquia.email ?? '',
      responsavel: paroquia.responsavel ?? ''
    });
  }


  inativar(paroquia: Paroquia): void {
    this.confirmationService.confirm({
      header: 'Confirmar inativação',
      message: `Inativar a paróquia/comunidade "${paroquia.nome}"?`,
      icon: 'fa-solid fa-triangle-exclamation',
      acceptLabel: 'Inativar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => this.executarInativacao(paroquia)
    });
  }

  reativar(paroquia: Paroquia): void {
    this.confirmationService.confirm({
      header: 'Confirmar reativação',
      message: `Reativar a paróquia/comunidade "${paroquia.nome}"?`,
      icon: 'fa-solid fa-circle-check',
      acceptLabel: 'Reativar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => this.executarReativacao(paroquia)
    });
  }

  excluir(paroquia: Paroquia): void {
    this.confirmationService.confirm({
      header: 'Confirmar exclusão definitiva',
      message: `Excluir definitivamente a paróquia/comunidade "${paroquia.nome}"?<br><br>A exclusão só será permitida se não houver vínculos. Esta ação não pode ser desfeita.`,
      icon: 'fa-solid fa-triangle-exclamation',
      acceptLabel: 'Excluir definitivamente',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => this.executarExclusao(paroquia)
    });
  }

  private executarInativacao(paroquia: Paroquia): void {
    this.service.inativar(paroquia.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Paróquia/Comunidade inativada',
          detail: 'Cadastro inativado com sucesso.',
          life: 4000
        });

        this.carregarParoquias();
      },
      error: erro => this.exibirErroOperacao(erro, 'Não foi possível inativar a paróquia/comunidade.')
    });
  }
  

  private executarReativacao(paroquia: Paroquia): void {
    this.service.reativar(paroquia.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Paróquia/Comunidade reativada',
          detail: 'Cadastro reativado com sucesso.',
          life: 4000
        });

        this.carregarParoquias();
      },
      error: erro => this.exibirErroOperacao(erro, 'Não foi possível reativar a paróquia/comunidade.')
    });
  }
  

  private executarExclusao(paroquia: Paroquia): void {
    this.service.excluir(paroquia.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Paróquia/Comunidade excluída',
          detail: 'Cadastro excluído com sucesso.',
          life: 4000
        });

        this.carregarParoquias();
      },
      error: erro => this.exibirErroOperacao(erro, 'Não foi possível excluir. Se houver vínculos, utilize a inativação.')
    });
  }
  

  labelAtivo(ativo: boolean): string {
    return ativo ? 'Ativa' : 'Inativa';
  }

  cancelarEdicao(): void {
    this.limparFormulario();
  }

  atualizarFiltroTexto(valor: string): void {
    this.filtroTexto.set(valor);
  }

  limparFiltroTexto(): void {
    this.filtroTexto.set('');
  }

  formatarCamposTexto(): void {
    this.customFormHelper.formatarCamposComTitleCase(this.form, [
      'nome',
      'endereco',
      'cidade',
      'responsavel'
    ]);
  }

  enderecoFormatado(paroquia: Paroquia): string {
    const partes = [
      paroquia.endereco,
      paroquia.cidade,
      paroquia.uf
    ].filter(Boolean);

    return partes.length > 0 ? partes.join(' - ') : 'Não informado';
  }

  limparFormulario(): void {
    this.paroquiaEmEdicao.set(null);

    this.customFormHelper.resetarFormulario(this.form, {
      nome: '',
      endereco: '',
      cidade: '',
      uf: '',
      telefone: '',
      email: '',
      responsavel: ''
    });
  }


  private exibirErroOperacao(erro: unknown, mensagemPadrao: string): void {
    console.error(mensagemPadrao, erro);

    const mensagemApi = (erro as { error?: { message?: string } })?.error?.message;

    this.messageService.add({
      severity: 'error',
      summary: 'Operação não realizada',
      detail: mensagemApi || mensagemPadrao,
      life: 6000
    });
  }

  private normalizarBusca(valor: unknown): string {
    return String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private montarPayload(): ParoquiaRequest {
    const valor = this.form.getRawValue();

    return {
      nome: valor.nome.trim(),
      endereco: this.normalizarTextoOpcional(valor.endereco),
      cidade: this.normalizarTextoOpcional(valor.cidade),
      uf: this.normalizarUf(valor.uf),
      telefone: this.normalizarTextoOpcional(valor.telefone),
      email: this.normalizarTextoOpcional(valor.email),
      responsavel: this.normalizarTextoOpcional(valor.responsavel)
    };
  }

  private normalizarTextoOpcional(valor: string): string | undefined {
    const texto = valor?.trim();
    return texto ? texto : undefined;
  }

  private normalizarUf(valor: string): string | undefined {
    const texto = valor?.trim().toUpperCase();
    return texto ? texto : undefined;
  }
}
