import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin, map, Observable } from 'rxjs';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { Evento, Sobrinho, TioCaronaEvento } from '../../shared/models';
import { EventoOperacaoService } from './evento-operacao.service';

type TipoListaPresenca = 'TIO_CARONA' | 'SOBRINHO';

interface LinhaPresencaPrint {
  numero: number;
  nome: string;
  papel: string;
}

interface ResultadoListaPresenca {
  evento: Evento;
  linhas: LinhaPresencaPrint[];
}

@Component({
  selector: 'app-evento-lista-presenca-print',
  standalone: true,
  imports: [
    RouterLink,
    ButtonModule,
    ProgressSpinnerModule
  ],
  templateUrl: './evento-lista-presenca-print.component.html',
  styleUrl: './evento-lista-presenca-print.component.scss'
})
export class EventoListaPresencaPrintComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(EventoOperacaoService);
  private readonly messageService = inject(MessageService);

  readonly eventoId = Number(this.route.snapshot.paramMap.get('eventoId'));
  readonly tipo = signal<TipoListaPresenca>('SOBRINHO');
  readonly evento = signal<Evento | null>(null);
  readonly linhas = signal<LinhaPresencaPrint[]>([]);
  readonly carregando = signal(false);
  readonly imprimindo = signal(false);
  readonly impressoEm = new Date();

  readonly titulo = computed(() =>
    this.tipo() === 'TIO_CARONA'
      ? 'Lista de presença dos tios carona'
      : 'Lista de presença dos encontristas'
  );

  readonly subtitulo = computed(() =>
    'Use em caso de conferência manual, pane de internet ou indisponibilidade do leitor de QR Code.'
  );

  private readonly aoFinalizarImpressao = (): void => {
    this.imprimindo.set(false);
  };

  ngOnInit(): void {
    document.body.classList.add('lista-presenca-print-mode');
    window.addEventListener('afterprint', this.aoFinalizarImpressao);

    this.lerParametros();
    this.carregar();
  }

  ngOnDestroy(): void {
    document.body.classList.remove('lista-presenca-print-mode');
    window.removeEventListener('afterprint', this.aoFinalizarImpressao);
  }

  imprimir(): void {
    if (this.carregando() || this.linhas().length === 0) {
      this.toastError('Não há participantes disponíveis para impressão.');
      return;
    }

    this.imprimindo.set(true);

    window.setTimeout(() => {
      window.focus();
      window.print();

      window.setTimeout(() => {
        this.imprimindo.set(false);
      }, 800);
    }, 300);
  }

  voltarLink(): unknown[] {
    return ['/eventos', this.eventoId, 'operacao'];
  }

  dataImpressao(): string {
    return this.formatarDataHora(this.impressoEm);
  }

  periodoEvento(): string {
    const evento = this.evento();

    if (!evento) {
      return '';
    }

    const inicio = this.formatarData(evento.dataInicio);
    const fim = this.formatarData(evento.dataFim);

    if (!inicio && !fim) {
      return '';
    }

    if (!fim || inicio === fim) {
      return inicio;
    }

    return `${inicio} a ${fim}`;
  }

  private lerParametros(): void {
    const tipoParam = this.route.snapshot.queryParamMap.get('tipo');

    if (tipoParam === 'TIO_CARONA' || tipoParam === 'SOBRINHO') {
      this.tipo.set(tipoParam);
    }
  }

  private carregar(): void {
    this.carregando.set(true);

    this.carregarDados()
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (resultado: ResultadoListaPresenca) => {
          this.evento.set(resultado.evento);
          this.linhas.set(resultado.linhas);
        },
        error: (erro: unknown) => {
          console.error('Erro ao carregar lista de presença', erro);
          this.toastError('Não foi possível carregar a lista de presença.');
          this.linhas.set([]);
        }
      });
  }

  private carregarDados(): Observable<ResultadoListaPresenca> {
    if (this.tipo() === 'TIO_CARONA') {
      return forkJoin({
        evento: this.service.buscarEvento(this.eventoId),
        tios: this.service.listarTiosCarona(this.eventoId)
      }).pipe(
        map(({ evento, tios }) => ({
          evento,
          linhas: this.montarLinhasTios(tios)
        }))
      );
    }

    return forkJoin({
      evento: this.service.buscarEvento(this.eventoId),
      sobrinhos: this.service.listarSobrinhos(this.eventoId)
    }).pipe(
      map(({ evento, sobrinhos }) => ({
        evento,
        linhas: this.montarLinhasEncontristas(sobrinhos)
      }))
    );
  }

  private montarLinhasTios(tios: TioCaronaEvento[]): LinhaPresencaPrint[] {
    return tios
      .filter(tio => String(tio.status ?? '').toUpperCase() === 'ATIVO')
      .sort((a, b) => String(a.pessoaNome ?? '').localeCompare(String(b.pessoaNome ?? ''), 'pt-BR'))
      .map((tio, index) => ({
        numero: index + 1,
        nome: String(tio.pessoaNome ?? ''),
        papel: 'Tio carona'
      }));
  }

  private montarLinhasEncontristas(sobrinhos: Sobrinho[]): LinhaPresencaPrint[] {
    return sobrinhos
      .filter(sobrinho => this.encontristaAtivo(sobrinho))
      .sort((a, b) => String(a.nome ?? '').localeCompare(String(b.nome ?? ''), 'pt-BR'))
      .map((sobrinho, index) => ({
        numero: index + 1,
        nome: String(sobrinho.nome ?? ''),
        papel: 'Encontrista'
      }));
  }

  private encontristaAtivo(sobrinho: Sobrinho): boolean {
    const statusCadastro = String(sobrinho.status ?? '').toUpperCase();
    const statusPresenca = String(sobrinho.statusAtualPresenca ?? '').toUpperCase();

    return statusCadastro !== 'DESISTENTE' && statusPresenca !== 'DESISTENTE';
  }

  private formatarData(valor?: string): string {
    if (!valor) {
      return '';
    }

    const [ano, mes, dia] = valor.substring(0, 10).split('-');

    if (!ano || !mes || !dia) {
      return valor;
    }

    return `${dia}/${mes}/${ano}`;
  }

  private formatarDataHora(data: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  }

  private toastError(detail: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Lista de presença',
      detail
    });
  }
}
