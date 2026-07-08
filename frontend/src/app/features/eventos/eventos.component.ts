import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Evento, EventoRequest, ParoquiaResumo } from '../../shared/models';
import { EventosService } from './eventos.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe
  ],
  templateUrl: './eventos.component.html',
  styleUrl: './eventos.component.scss'
})
export class EventosComponent implements OnInit {
  private readonly service = inject(EventosService);
  private readonly fb = inject(FormBuilder);

  readonly eventos = signal<Evento[]>([]);
  readonly paroquias = signal<ParoquiaResumo[]>([]);

  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly mensagemErro = signal('');
  readonly mensagemSucesso = signal('');
  readonly eventoEmEdicao = signal<Evento | null>(null);

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
    status: ['PLANEJADO' as EventoRequest['status'], [Validators.required]],
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
      error: () => this.mensagemErro.set('Não foi possível carregar as paróquias.')
    });
  }

  carregarEventos(): void {
    this.carregando.set(true);
    this.mensagemErro.set('');

    this.service.listar().subscribe({
      next: eventos => {
        this.eventos.set(eventos);
        this.carregando.set(false);
      },
      error: () => {
        this.mensagemErro.set('Não foi possível carregar os eventos.');
        this.carregando.set(false);
      }
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensagemErro.set('Preencha os campos obrigatórios antes de salvar.');
      return;
    }

    const payload = this.montarPayload();
    const eventoAtual = this.eventoEmEdicao();

    this.salvando.set(true);
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');

    const requisicao = eventoAtual
      ? this.service.atualizar(eventoAtual.id, payload)
      : this.service.criar(payload);

    requisicao.subscribe({
      next: () => {
        this.mensagemSucesso.set(eventoAtual ? 'Evento atualizado com sucesso.' : 'Evento cadastrado com sucesso.');
        this.salvando.set(false);
        this.limparFormulario();
        this.carregarEventos();
      },
      error: erro => {
        console.error('Erro ao salvar evento', erro);
        this.mensagemErro.set('Não foi possível salvar o evento. Confira os dados informados.');
        this.salvando.set(false);
      }
    });
  }

  editar(evento: Evento): void {
    this.eventoEmEdicao.set(evento);
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');

    this.form.patchValue({
      paroquiaId: evento.paroquiaId,
      nome: evento.nome,
      tema: evento.tema ?? '',
      local: evento.local ?? '',
      dataInicio: this.paraInputDateTime(evento.dataInicio),
      dataFim: this.paraInputDateTime(evento.dataFim),
      status: evento.status,
      monitoramentoAtivo: evento.monitoramentoAtivo,
      monitoramentoInicio: evento.monitoramentoInicio ?? '05:00',
      monitoramentoFim: evento.monitoramentoFim ?? '20:00'
    });
  }

  cancelarEdicao(): void {
    this.limparFormulario();
  }

  private limparFormulario(): void {
    this.eventoEmEdicao.set(null);

    this.form.reset({
      paroquiaId: 0,
      nome: '',
      tema: '',
      local: '',
      dataInicio: '',
      dataFim: '',
      status: 'PLANEJADO',
      monitoramentoAtivo: false,
      monitoramentoInicio: '05:00',
      monitoramentoFim: '20:00'
    });
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
 * O input datetime-local retorna algo como "2026-07-08T09:00".
 * O backend atual usa LocalDate no EventoRequest, então enviamos apenas "2026-07-08".
 */
  private paraLocalDate(valor: string): string {
    if (!valor) {
      return valor;
    }

    return valor.substring(0, 10);
  }

  /**
 * Converte data recebida da API para o formato aceito pelo input datetime-local.
 * Como a API retorna LocalDate ("2026-07-08"), adicionamos um horário padrão
 * apenas para preencher o campo visual do formulário.
 */
  private paraInputDateTime(valor: string): string {
    if (!valor) {
      return '';
    }

    if (valor.length === 10) {
      return `${valor}T08:00`;
    }

    return valor.substring(0, 16);
  }
}