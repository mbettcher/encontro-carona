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
  TioCaronaEvento
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

  readonly codigoForm = this.fb.nonNullable.group({
    codigoIdentificacao: ['', [Validators.required, Validators.maxLength(80)]],
    tipoOperacao: ['CHECKIN' as 'CHECKIN' | 'CHECKOUT', [Validators.required]]
  });

  readonly tiosAtivos = computed(() =>
    this.tiosCarona().filter(tio => tio.status === 'ATIVO')
  );

  readonly tiosAguardandoCheckin = computed(() =>
    this.tiosAtivos().filter(tio => !tio.checkinRealizado)
  );

  readonly tiosComCheckin = computed(() =>
    this.tiosAtivos().filter(tio => tio.checkinRealizado && !tio.checkoutRealizado)
  );

  readonly tiosComCheckout = computed(() =>
    this.tiosAtivos().filter(tio => tio.checkoutRealizado)
  );

  readonly duplasAtivas = computed(() =>
    this.duplas().filter(dupla => dupla.status === 'ATIVA')
  );

  readonly sobrinhosInscritos = computed(() =>
    this.sobrinhos().filter(sobrinho => sobrinho.status === 'INSCRITO')
  );

  readonly sobrinhosPresentes = computed(() =>
    this.sobrinhos().filter(sobrinho => sobrinho.status === 'PRESENTE')
  );

  readonly sobrinhosAusentes = computed(() =>
    this.sobrinhos().filter(sobrinho => sobrinho.status === 'AUSENTE')
  );

  readonly sobrinhosDesistentes = computed(() =>
    this.sobrinhos().filter(sobrinho => sobrinho.status === 'DESISTENTE')
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

  registrarOperacaoPorCodigo(): void {
    if (this.codigoForm.invalid) {
      this.codigoForm.markAllAsTouched();

      this.toastWarn('Informe o código da credencial para registrar a operação.');
      return;
    }

    const valor = this.codigoForm.getRawValue();

    this.processandoCodigo.set(true);

    window.setTimeout(() => {
      this.processandoCodigo.set(false);

      this.toastWarn(
        valor.tipoOperacao === 'CHECKIN'
          ? 'Leitura realizada, mas o endpoint de check-in ainda será implementado no backend.'
          : 'Leitura realizada, mas o endpoint de checkout ainda será implementado no backend.'
      );

      this.codigoForm.patchValue({
        codigoIdentificacao: ''
      });
    }, 400);
  }

  registrarCheckinManual(tio: TioCaronaEvento): void {
    this.processandoManual.set(tio.id);

    window.setTimeout(() => {
      this.processandoManual.set(null);
      this.toastWarn(`Check-in manual de ${tio.pessoaNome} ainda depende do endpoint no backend.`);
    }, 400);
  }

  registrarCheckoutManual(tio: TioCaronaEvento): void {
    this.processandoManual.set(tio.id);

    window.setTimeout(() => {
      this.processandoManual.set(null);
      this.toastWarn(`Checkout manual de ${tio.pessoaNome} ainda depende do endpoint no backend.`);
    }, 400);
  }

  aoPressionarEnterCodigo(event: Event): void {
    event.preventDefault();
    this.registrarOperacaoPorCodigo();
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
    if (tio.checkoutRealizado) {
      return 'Checkout realizado';
    }

    if (tio.checkinRealizado) {
      return 'Check-in realizado';
    }

    return 'Aguardando check-in';
  }

  severityStatusOperacionalTio(tio: TioCaronaEvento): 'info' | 'success' | 'warn' | 'secondary' {
    if (tio.checkoutRealizado) {
      return 'secondary';
    }

    if (tio.checkinRealizado) {
      return 'success';
    }

    return 'warn';
  }

  codigoIdentificacaoTio(tio: TioCaronaEvento): string {
    return tio.codigoIdentificacao || `TC-${String(tio.id).padStart(6, '0')}`;
  }

  podeCheckinManual(tio: TioCaronaEvento): boolean {
    return !tio.checkinRealizado;
  }

  podeCheckoutManual(tio: TioCaronaEvento): boolean {
    return !!tio.checkinRealizado && !tio.checkoutRealizado;
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
}