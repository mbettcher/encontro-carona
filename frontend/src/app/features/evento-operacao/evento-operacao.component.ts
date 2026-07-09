import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import {
  DuplaTioCarona,
  Evento,
  Sobrinho,
  SobrinhoDupla,
  TioCaronaEvento,
  OperacaoPresencaSobrinho
} from '../../shared/models';
import { EventoOperacaoService } from './evento-operacao.service';

@Component({
  selector: 'app-evento-operacao',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    InputTextModule,
    ProgressBarModule,
    SelectModule,
    TableModule,
    TagModule
  ],
  templateUrl: './evento-operacao.component.html',
  styleUrl: './evento-operacao.component.scss'
})
export class EventoOperacaoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(EventoOperacaoService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  readonly eventoId = Number(this.route.snapshot.paramMap.get('eventoId'));

  readonly evento = signal<Evento | null>(null);
  readonly tiosCarona = signal<TioCaronaEvento[]>([]);
  readonly duplas = signal<DuplaTioCarona[]>([]);
  readonly sobrinhos = signal<Sobrinho[]>([]);
  readonly vinculos = signal<SobrinhoDupla[]>([]);
  readonly carregando = signal(false);
  readonly processandoCodigo = signal(false);
  readonly processandoManual = signal<number | null>(null);
  readonly processandoPresencaSobrinho = signal<number | null>(null);
  readonly filtroTiosOperacao = signal('');
  readonly filtroPresencaSobrinhos = signal('');
  readonly filtroSobrinhosEvento = signal('');

  readonly codigoForm = this.fb.nonNullable.group({
    codigoIdentificacao: ['', [Validators.required, Validators.maxLength(80)]],
    tipoOperacao: ['CHECKIN' as 'CHECKIN' | 'CHECKOUT', [Validators.required]]
  });

  readonly tiosAtivos = computed(() =>
    this.tiosCarona().filter(tio => tio.status === 'ATIVO')
  );

  readonly tiosAguardandoCheckin = computed(() =>
    this.tiosAtivos().filter(tio =>
      !tio.statusOperacional || tio.statusOperacional === 'AGUARDANDO_CHECKIN'
    )
  );

  readonly tiosComCheckin = computed(() =>
    this.tiosAtivos().filter(tio => tio.statusOperacional === 'COM_CHECKIN')
  );

  readonly tiosComCheckout = computed(() =>
    this.tiosAtivos().filter(tio => tio.statusOperacional === 'COM_CHECKOUT')
  );

  readonly duplasAtivas = computed(() =>
    this.duplas().filter(dupla => dupla.status === 'ATIVA')
  );

  readonly sobrinhosInscritos = computed(() =>
    this.sobrinhos().filter(sobrinho => this.statusPresencaSobrinho(sobrinho) === 'INSCRITO')
  );

  readonly sobrinhosPresentes = computed(() =>
    this.sobrinhos().filter(sobrinho => this.statusPresencaSobrinho(sobrinho) === 'PRESENTE')
  );

  readonly sobrinhosAusentes = computed(() =>
    this.sobrinhos().filter(sobrinho => this.statusPresencaSobrinho(sobrinho) === 'AUSENTE')
  );

  readonly sobrinhosDesistentes = computed(() =>
    this.sobrinhos().filter(sobrinho => this.statusPresencaSobrinho(sobrinho) === 'DESISTENTE')
  );

  readonly vinculosAtivos = computed(() =>
    this.vinculos().filter(vinculo => vinculo.status === 'ATIVO')
  );

  readonly percentualVinculados = computed(() => {
    const total = this.sobrinhos().length;

    if (total === 0) {
      return 0;
    }

    return Math.round((this.vinculosAtivos().length / total) * 100);
  });

  readonly percentualPresentes = computed(() => {
    const total = this.sobrinhos().length;

    if (total === 0) {
      return 0;
    }

    return Math.round((this.sobrinhosPresentes().length / total) * 100);
  });

  readonly operacaoPronta = computed(() =>
    this.tiosAtivos().length >= 2 &&
    this.duplasAtivas().length >= 1 &&
    this.sobrinhos().length >= 1 &&
    this.vinculosAtivos().length >= 1
  );

  readonly tiosOperacaoFiltrados = computed(() => {
    const filtro = this.normalizarFiltro(this.filtroTiosOperacao());

    if (!filtro) {
      return this.tiosAtivos();
    }

    return this.tiosAtivos().filter(tio =>
      this.contemFiltro(tio.pessoaNome, filtro) ||
      this.contemFiltro(tio.codigoIdentificacao, filtro) ||
      this.contemFiltro(tio.statusOperacional, filtro) ||
      this.contemFiltro(this.labelStatusOperacionalTio(tio), filtro)
    );
  });

  readonly presencaSobrinhosFiltrados = computed(() => {
    const filtro = this.normalizarFiltro(this.filtroPresencaSobrinhos());

    if (!filtro) {
      return this.sobrinhos();
    }

    return this.sobrinhos().filter(sobrinho =>
      this.contemFiltro(sobrinho.nome, filtro) ||
      this.contemFiltro(sobrinho.responsavelNome, filtro) ||
      this.contemFiltro(sobrinho.responsavelTelefone, filtro) ||
      this.contemFiltro(sobrinho.telefone, filtro) ||
      this.contemFiltro(this.statusPresencaSobrinho(sobrinho), filtro) ||
      this.contemFiltro(this.labelSobrinhoStatus(this.statusPresencaSobrinho(sobrinho)), filtro)
    );
  });

  readonly sobrinhosEventoFiltrados = computed(() => {
    const filtro = this.normalizarFiltro(this.filtroSobrinhosEvento());

    if (!filtro) {
      return this.sobrinhos();
    }

    return this.sobrinhos().filter(sobrinho =>
      this.contemFiltro(sobrinho.nome, filtro) ||
      this.contemFiltro(sobrinho.responsavelNome, filtro) ||
      this.contemFiltro(sobrinho.responsavelTelefone, filtro) ||
      this.contemFiltro(sobrinho.telefone, filtro) ||
      this.contemFiltro(this.statusPresencaSobrinho(sobrinho), filtro) ||
      this.contemFiltro(this.labelSobrinhoStatus(this.statusPresencaSobrinho(sobrinho)), filtro)
    );
  });

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.carregando.set(true);

    this.carregarEvento();
    this.carregarTios();
    this.carregarDuplas();
    this.carregarSobrinhos();
    this.carregarVinculos();

    window.setTimeout(() => this.carregando.set(false), 600);
  }

  alterarFiltroTiosOperacao(valor: string): void {
    this.filtroTiosOperacao.set(valor);
  }

  alterarFiltroPresencaSobrinhos(valor: string): void {
    this.filtroPresencaSobrinhos.set(valor);
  }

  alterarFiltroSobrinhosEvento(valor: string): void {
    this.filtroSobrinhosEvento.set(valor);
  }

  registrarOperacaoPorCodigo(): void {
    if (this.codigoForm.invalid) {
      this.codigoForm.markAllAsTouched();
      this.toastWarn('Informe o código da credencial para registrar a operação.');
      return;
    }

    const valor = this.codigoForm.getRawValue();
    const codigo = valor.codigoIdentificacao.trim();

    this.processandoCodigo.set(true);

    const requisicao =
      valor.tipoOperacao === 'CHECKIN'
        ? this.service.registrarCheckinPorCodigo(this.eventoId, codigo)
        : this.service.registrarCheckoutPorCodigo(this.eventoId, codigo);

    requisicao.subscribe({
      next: tioAtualizado => {
        this.atualizarTioCaronaNaLista(tioAtualizado);

        this.codigoForm.patchValue({
          codigoIdentificacao: ''
        });

        this.toastSuccess(
          valor.tipoOperacao === 'CHECKIN'
            ? `Check-in registrado para ${tioAtualizado.pessoaNome}.`
            : `Checkout registrado para ${tioAtualizado.pessoaNome}.`
        );
      },
      error: erro => {
        console.error('Erro ao registrar operação por código', erro);
        this.toastError(this.mensagemErro(erro, 'Não foi possível registrar a operação por código.'));
      },
      complete: () => {
        this.processandoCodigo.set(false);
      }
    });
  }

  registrarCheckinManual(tio: TioCaronaEvento): void {
    this.processandoManual.set(tio.id);

    this.service.registrarCheckinManual(this.eventoId, tio.id).subscribe({
      next: tioAtualizado => {
        this.atualizarTioCaronaNaLista(tioAtualizado);
        this.toastSuccess(`Check-in manual registrado para ${tioAtualizado.pessoaNome}.`);
      },
      error: erro => {
        console.error('Erro ao registrar check-in manual', erro);
        this.toastError(this.mensagemErro(erro, 'Não foi possível registrar o check-in manual.'));
      },
      complete: () => {
        this.processandoManual.set(null);
      }
    });
  }

  registrarCheckoutManual(tio: TioCaronaEvento): void {
    this.processandoManual.set(tio.id);

    this.service.registrarCheckoutManual(this.eventoId, tio.id).subscribe({
      next: tioAtualizado => {
        this.atualizarTioCaronaNaLista(tioAtualizado);
        this.toastSuccess(`Checkout manual registrado para ${tioAtualizado.pessoaNome}.`);
      },
      error: erro => {
        console.error('Erro ao registrar checkout manual', erro);
        this.toastError(this.mensagemErro(erro, 'Não foi possível registrar o checkout manual.'));
      },
      complete: () => {
        this.processandoManual.set(null);
      }
    });
  }

  private atualizarSobrinhoNaLista(sobrinhoAtualizado: Sobrinho): void {
    this.sobrinhos.update(sobrinhos =>
      sobrinhos.map(sobrinho =>
        sobrinho.id === sobrinhoAtualizado.id ? sobrinhoAtualizado : sobrinho
      )
    );
  }

  private atualizarTioCaronaNaLista(tioAtualizado: TioCaronaEvento): void {
    this.tiosCarona.update(tios =>
      tios.map(tio =>
        tio.id === tioAtualizado.id ? tioAtualizado : tio
      )
    );
  }

  aoPressionarEnterCodigo(event: Event): void {
    event.preventDefault();
    this.registrarOperacaoPorCodigo();
  }

  registrarPresencaSobrinho(
    sobrinho: Sobrinho,
    operacao: OperacaoPresencaSobrinho
  ): void {
    this.processandoPresencaSobrinho.set(sobrinho.id);

    this.service.registrarPresencaSobrinho(this.eventoId, sobrinho.id, operacao).subscribe({
      next: sobrinhoAtualizado => {
        this.atualizarSobrinhoNaLista(sobrinhoAtualizado);

        this.toastSuccess(
          `${sobrinhoAtualizado.nome} marcado como ${this.labelSobrinhoStatus(this.statusPresencaSobrinho(sobrinhoAtualizado)).toLowerCase()}.`
        );
      },
      error: erro => {
        console.error('Erro ao registrar presença do sobrinho', erro);
        this.toastError(this.mensagemErro(erro, 'Não foi possível registrar a presença do sobrinho.'));
      },
      complete: () => {
        this.processandoPresencaSobrinho.set(null);
      }
    });
  }

  labelOperacao(): string {
    return this.operacaoPronta() ? 'Pronta para operação' : 'Preparação incompleta';
  }

  severityOperacao(): 'success' | 'warn' {
    return this.operacaoPronta() ? 'success' : 'warn';
  }

  labelSobrinhoStatus(status: string): string {
    switch (status) {
      case 'INSCRITO':
        return 'Inscrito';
      case 'PRESENTE':
        return 'Presente';
      case 'AUSENTE':
        return 'Ausente';
      case 'DESISTENTE':
        return 'Desistente';
      default:
        return status;
    }
  }

  severitySobrinhoStatus(status: string): 'info' | 'success' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'INSCRITO':
        return 'info';
      case 'PRESENTE':
        return 'success';
      case 'AUSENTE':
        return 'warn';
      case 'DESISTENTE':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  labelStatusOperacionalTio(tio: TioCaronaEvento): string {
    switch (tio.statusOperacional) {
      case 'COM_CHECKIN':
        return 'Check-in em aberto';
      case 'COM_CHECKOUT':
        return 'Fora no momento';
      case 'AGUARDANDO_CHECKIN':
      default:
        return 'Aguardando check-in';
    }
  }

  severityStatusOperacionalTio(tio: TioCaronaEvento): 'info' | 'success' | 'warn' | 'secondary' {
    switch (tio.statusOperacional) {
      case 'COM_CHECKIN':
        return 'success';
      case 'COM_CHECKOUT':
        return 'secondary';
      case 'AGUARDANDO_CHECKIN':
      default:
        return 'warn';
    }
  }

  podeCheckinManual(tio: TioCaronaEvento): boolean {
    return tio.statusOperacional !== 'COM_CHECKIN';
  }

  podeCheckoutManual(tio: TioCaronaEvento): boolean {
    return tio.statusOperacional === 'COM_CHECKIN';
  }


  codigoIdentificacaoTio(tio: TioCaronaEvento): string {
    return tio.codigoIdentificacao || `TC-${String(tio.id).padStart(6, '0')}`;
  }

  private carregarEvento(): void {
    this.service.buscarEvento(this.eventoId).subscribe({
      next: evento => this.evento.set(evento),
      error: erro => {
        console.error('Erro ao carregar evento', erro);
        this.toastError('Não foi possível carregar os dados do evento.');
      }
    });
  }

  private carregarTios(): void {
    this.service.listarTiosCarona(this.eventoId).subscribe({
      next: tios => this.tiosCarona.set(tios),
      error: erro => {
        console.error('Erro ao carregar tios carona', erro);
        this.toastError('Não foi possível carregar os tios carona.');
      }
    });
  }

  private carregarDuplas(): void {
    this.service.listarDuplas(this.eventoId).subscribe({
      next: duplas => this.duplas.set(duplas),
      error: erro => {
        console.error('Erro ao carregar duplas', erro);
        this.toastError('Não foi possível carregar as duplas.');
      }
    });
  }

  private carregarSobrinhos(): void {
    this.service.listarSobrinhos(this.eventoId).subscribe({
      next: sobrinhos => this.sobrinhos.set(sobrinhos),
      error: erro => {
        console.error('Erro ao carregar sobrinhos', erro);
        this.toastError('Não foi possível carregar os sobrinhos.');
      }
    });
  }

  private carregarVinculos(): void {
    this.service.listarVinculos(this.eventoId).subscribe({
      next: vinculos => this.vinculos.set(vinculos),
      error: erro => {
        console.error('Erro ao carregar vínculos', erro);
        this.toastError('Não foi possível carregar os vínculos.');
      }
    });
  }

  private mensagemErro(erro: unknown, fallback: string): string {
    if (
      typeof erro === 'object' &&
      erro !== null &&
      'error' in erro
    ) {
      const corpo = (erro as { error?: { message?: string; detail?: string; title?: string } }).error;

      return corpo?.message || corpo?.detail || corpo?.title || fallback;
    }

    return fallback;
  }

  private normalizarFiltro(valor: string): string {
    return valor
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private contemFiltro(valor: string | undefined | null, filtro: string): boolean {
    if (!valor) {
      return false;
    }

    return this.normalizarFiltro(String(valor)).includes(filtro);
  }

  private toastSuccess(detail: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail,
      life: 4000
    });
  }

  private toastWarn(detail: string): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Atenção',
      detail,
      life: 5000
    });
  }

  private toastError(detail: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail,
      life: 6000
    });
  }

  statusPresencaSobrinho(sobrinho: Sobrinho): string {
    return sobrinho.statusAtualPresenca || sobrinho.status;
  }

  ultimaPresencaSobrinho(sobrinho: Sobrinho): string | undefined {
    return sobrinho.ultimaPresencaEm;
  }

  podeMarcarPresente(sobrinho: Sobrinho): boolean {
    const status = this.statusPresencaSobrinho(sobrinho);

    return status !== 'PRESENTE' && status !== 'DESISTENTE';
  }

  podeMarcarAusente(sobrinho: Sobrinho): boolean {
    const status = this.statusPresencaSobrinho(sobrinho);

    return status !== 'AUSENTE' && status !== 'DESISTENTE';
  }

  podeMarcarDesistente(sobrinho: Sobrinho): boolean {
    return this.statusPresencaSobrinho(sobrinho) !== 'DESISTENTE';
  }

  sobrinhoDesistente(sobrinho: Sobrinho): boolean {
    return this.statusPresencaSobrinho(sobrinho) === 'DESISTENTE';
  }
}