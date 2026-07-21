import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { Evento, EventoRequest, EventoStatus, ParoquiaResumo } from '../../shared/models';
import { CustomFormHelperService } from '../../shared/services/custom-form-helper.service';
import { AuthService } from '../../core/auth/auth.service';
import { EventosService } from './eventos.service';

interface StatusOpcao {
  label: string;
  value: EventoStatus;
}

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    CheckboxModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule
  ],
  templateUrl: './eventos.component.html',
  providers: [ConfirmationService],
  styleUrl: './eventos.component.scss'
})
export class EventosComponent implements OnInit {
  readonly seguranca = inject(AuthService);

  private readonly service = inject(EventosService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly customFormHelper = inject(CustomFormHelperService);

  readonly eventos = signal<Evento[]>([]);
  readonly filtroTexto = signal('');
  readonly paroquias = signal<ParoquiaResumo[]>([]);
  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly eventoEmEdicao = signal<Evento | null>(null);


  readonly paroquiasFormulario = computed(() => {
    const paroquiaAtualId = this.eventoEmEdicao()?.paroquiaId;

    return this.paroquias()
      .filter(paroquia => paroquia.ativo || paroquia.id === paroquiaAtualId);
  });

  readonly eventosFiltrados = computed(() => {
    const termo = this.normalizarBusca(this.filtroTexto());

    if (!termo) {
      return this.eventos();
    }

    return this.eventos().filter(evento => [
      evento.nome,
      evento.tema,
      evento.local,
      evento.status,
      this.labelStatus(evento.status),
      this.nomeParoquia(evento),
      evento.dataInicio,
      evento.dataFim,
      evento.monitoramentoAtivo ? 'monitoramento ativo' : 'monitoramento inativo'
    ].some(valor => this.normalizarBusca(valor).includes(termo)));
  });

  readonly statusOpcoes: StatusOpcao[] = [
    { label: 'Planejado', value: 'PLANEJADO' },
    { label: 'Em andamento', value: 'EM_ANDAMENTO' },
    { label: 'Encerrado', value: 'ENCERRADO' },
    { label: 'Cancelado', value: 'CANCELADO' },
    { label: 'Inativo', value: 'INATIVO' }
  ];

  readonly tituloFormulario = computed(() =>
    this.eventoEmEdicao() ? 'Editar evento' : 'Novo evento'
  );

  readonly form = this.fb.nonNullable.group({
    paroquiaId: [0, [Validators.required, Validators.min(1)]],
    nome: ['', [Validators.required, Validators.maxLength(160)]],
    tema: ['', [Validators.maxLength(160)]],
    local: ['', [Validators.maxLength(200)]],
    dataInicio: ['', [Validators.required]],
    dataFim: ['', [Validators.required]],
    status: ['PLANEJADO' as EventoStatus, [Validators.required]],
    monitoramentoAtivo: [false],
    monitoramentoInicio: ['05:00'],
    monitoramentoFim: ['20:00']
  });

  ngOnInit(): void {
    this.carregarParoquias();
    this.carregarEventos();
  }

  carregarParoquias(): void {
    this.service.listarParoquias().subscribe({
      next: paroquias => this.paroquias.set(paroquias),
      error: erro => {
        console.error('Erro ao carregar Paróquia/Comunidade', erro);

        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao carregar',
          detail: 'Não foi possível carregar as Paróquia/Comunidade.',
          life: 5000
        });
      }
    });
  }

  carregarEventos(): void {
    this.carregando.set(true);

    this.service.listar().subscribe({
      next: eventos => {
        this.eventos.set(eventos);
        this.carregando.set(false);
      },
      error: erro => {
        console.error('Erro ao carregar eventos', erro);

        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao carregar',
          detail: 'Não foi possível carregar os eventos.',
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
        detail: 'Preencha os campos obrigatórios antes de salvar.',
        life: 4000
      });

      return;
    }

    this.formatarCamposTexto();

    const payload = this.montarPayload();
    const eventoAtual = this.eventoEmEdicao();

    if (payload.dataInicio > payload.dataFim) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Período inválido',
        detail: 'A data de início não pode ser posterior à data de fim.',
        life: 5000
      });

      return;
    }

    this.salvando.set(true);

    const requisicao = eventoAtual
      ? this.service.atualizar(eventoAtual.id, payload)
      : this.service.criar(payload);

    requisicao.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: eventoAtual ? 'Evento atualizado com sucesso.' : 'Evento cadastrado com sucesso.',
          life: 4000
        });

        this.salvando.set(false);
        this.limparFormulario();
        this.carregarEventos();
      },
      error: erro => {
        console.error('Erro ao salvar evento', erro);

        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao salvar',
          detail: 'Não foi possível salvar o evento. Confira os dados informados.',
          life: 6000
        });

        this.salvando.set(false);
      }
    });
  }

  editar(evento: Evento): void {
    this.eventoEmEdicao.set(evento);

    this.form.patchValue({
      paroquiaId: evento.paroquiaId,
      nome: evento.nome,
      tema: evento.tema ?? '',
      local: evento.local ?? '',
      dataInicio: this.paraInputDate(evento.dataInicio),
      dataFim: this.paraInputDate(evento.dataFim),
      status: evento.status,
      monitoramentoAtivo: evento.monitoramentoAtivo,
      monitoramentoInicio: evento.monitoramentoInicio ?? '05:00',
      monitoramentoFim: evento.monitoramentoFim ?? '20:00'
    });
  }


  inativar(evento: Evento): void {
    this.confirmationService.confirm({
      header: 'Confirmar inativação',
      message: `Inativar o evento "${evento.nome}"?`,
      icon: 'fa-solid fa-triangle-exclamation',
      acceptLabel: 'Inativar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => this.executarInativacao(evento)
    });
  }

  reativar(evento: Evento): void {
    this.confirmationService.confirm({
      header: 'Confirmar reativação',
      message: `Reativar o evento "${evento.nome}"?`,
      icon: 'fa-solid fa-circle-check',
      acceptLabel: 'Reativar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => this.executarReativacao(evento)
    });
  }

  excluir(evento: Evento): void {
    this.confirmationService.confirm({
      header: 'Confirmar exclusão definitiva',
      message: `Excluir definitivamente o evento "${evento.nome}"?<br><br>A exclusão só será permitida se não houver dados operacionais vinculados. Esta ação não pode ser desfeita.`,
      icon: 'fa-solid fa-triangle-exclamation',
      acceptLabel: 'Excluir definitivamente',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => this.executarExclusao(evento)
    });
  }

  private executarInativacao(evento: Evento): void {
    this.service.inativar(evento.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Evento inativado',
          detail: 'Evento inativado com sucesso.',
          life: 4000
        });

        this.carregarEventos();
      },
      error: erro => this.exibirErroOperacao(erro, 'Não foi possível inativar o evento.')
    });
  }
  

  private executarReativacao(evento: Evento): void {
    this.service.reativar(evento.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Evento reativado',
          detail: 'Evento reativado com sucesso.',
          life: 4000
        });

        this.carregarEventos();
      },
      error: erro => this.exibirErroOperacao(erro, 'Não foi possível reativar o evento.')
    });
  }
  

  private executarExclusao(evento: Evento): void {
    this.service.excluir(evento.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Evento excluído',
          detail: 'Evento excluído com sucesso.',
          life: 4000
        });

        this.carregarEventos();
      },
      error: erro => this.exibirErroOperacao(erro, 'Não foi possível excluir o evento. Se houver vínculos, utilize a inativação.')
    });
  }
  

  cancelarEdicao(): void {
    this.limparFormulario();
  }

  formatarCamposTexto(): void {
    this.customFormHelper.formatarCamposComTitleCase(this.form, [
      'nome',
      'tema',
      'local'
    ]);
  }

  atualizarFiltroTexto(valor: string): void {
    this.filtroTexto.set(valor);
  }

  limparFiltroTexto(): void {
    this.filtroTexto.set('');
  }

  labelStatus(status: EventoStatus): string {
    return this.statusOpcoes.find(opcao => opcao.value === status)?.label ?? status;
  }


  severityStatus(status: EventoStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'PLANEJADO':
        return 'info';
      case 'EM_ANDAMENTO':
        return 'success';
      case 'ENCERRADO':
        return 'secondary';
      case 'CANCELADO':
        return 'danger';
      case 'INATIVO':
        return 'secondary';
    }
  }

  nomeParoquia(evento: Evento): string {
    if (evento.paroquiaNome) {
      return evento.paroquiaNome;
    }

    const paroquia = this.paroquias().find(item => item.id === evento.paroquiaId);
    return paroquia?.nome ?? `Paróquia/Comunidade #${evento.paroquiaId}`;
  }

  limparFormulario(): void {
    this.eventoEmEdicao.set(null);

    this.customFormHelper.resetarFormulario(this.form, {
      paroquiaId: 0,
      nome: '',
      tema: '',
      local: '',
      dataInicio: '',
      dataFim: '',
      status: 'PLANEJADO' as EventoStatus,
      monitoramentoAtivo: false,
      monitoramentoInicio: '05:00',
      monitoramentoFim: '20:00'
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

  private montarPayload(): EventoRequest {
    const valor = this.form.getRawValue();

    return {
      paroquiaId: Number(valor.paroquiaId),
      nome: valor.nome.trim(),
      tema: this.normalizarTextoOpcional(valor.tema),
      local: this.normalizarTextoOpcional(valor.local),
      dataInicio: this.paraLocalDate(valor.dataInicio),
      dataFim: this.paraLocalDate(valor.dataFim),
      status: valor.status,
      monitoramentoAtivo: valor.monitoramentoAtivo,
      monitoramentoInicio: valor.monitoramentoAtivo ? valor.monitoramentoInicio : null,
      monitoramentoFim: valor.monitoramentoAtivo ? valor.monitoramentoFim : null
    };
  }

  private normalizarTextoOpcional(valor: string): string | undefined {
    const texto = valor?.trim();
    return texto ? texto : undefined;
  }

  /**
   * Backend usa LocalDate no EventoRequest.
   * Formato esperado pela API: yyyy-MM-dd.
   */
  private paraLocalDate(valor: string): string {
    if (!valor) {
      return valor;
    }

    return valor.substring(0, 10);
  }

  /**
   * Converte data recebida da API para o formato aceito pelo input date.
   */
  private paraInputDate(valor: string): string {
    if (!valor) {
      return '';
    }

    return valor.substring(0, 10);
  }
}
