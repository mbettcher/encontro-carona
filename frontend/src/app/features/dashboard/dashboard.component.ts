import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

import {
  DashboardEventoOpcao,
  DashboardEventoResumo,
  DashboardResumo,
  DashboardSobrinhoPresenca,
  DashboardStatusPresenca
} from './dashboard.models';
import { DashboardService } from './dashboard.service';

type DashboardCardTheme =
  | 'blue'
  | 'green'
  | 'purple'
  | 'pink'
  | 'amber'
  | 'red'
  | 'cyan'
  | 'slate';

type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

interface DashboardCard {
  titulo: string;
  valor: number | string;
  subtitulo: string;
  icone: string;
  tema: DashboardCardTheme;
}

interface DashboardAction {
  titulo: string;
  descricao: string;
  icone: string;
  routerLink: unknown[] | string;
  tema: DashboardCardTheme;
}

interface DashboardProgressMetric {
  titulo: string;
  descricao: string;
  valor: number;
  total: number;
  percentual: number;
  tema: DashboardCardTheme;
}

interface EventoSelectOption {
  label: string;
  value: number;
}

interface PresencaDiaStacked {
  data: string;
  label: string;
  presentes: number;
  ausentes: number;
  desistentes: number;
  semRegistro: number;
  total: number;
  percentualPresentes: number;
  percentualAusentes: number;
  percentualDesistentes: number;
  percentualSemRegistro: number;
}

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    ProgressSpinnerModule,
    SelectModule,
    TagModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly carregando = signal(false);
  readonly carregandoEventos = signal(false);
  readonly carregandoPresencas = signal(false);
  readonly erro = signal<string | null>(null);
  readonly resumo = signal<DashboardResumo | null>(null);
  readonly eventos = signal<DashboardEventoOpcao[]>([]);
  readonly eventoSelecionadoId = signal<number | null>(null);
  readonly presencasEvento = signal<DashboardSobrinhoPresenca[]>([]);

  readonly base = computed(() => this.resumo()?.base ?? null);
  readonly evento = computed(() => this.resumo()?.evento ?? null);

  readonly opcoesEvento = computed<EventoSelectOption[]>(() =>
    [...this.eventos()]
      .sort((a, b) => this.dataReferenciaEvento(b).localeCompare(this.dataReferenciaEvento(a)))
      .map(evento => ({
        label: this.labelEventoOpcao(evento),
        value: evento.id
      }))
  );

  readonly cardsGerais = computed<DashboardCard[]>(() => {
    const base = this.base();

    if (!base) {
      return [];
    }

    return [
      {
        titulo: 'Eventos cadastrados',
        valor: base.totalEventos,
        subtitulo: 'Agenda geral do sistema',
        icone: 'fa-solid fa-calendar-days',
        tema: 'blue'
      },
      {
        titulo: 'Pessoas cadastradas',
        valor: base.totalPessoas,
        subtitulo: 'Base geral de participantes',
        icone: 'fa-solid fa-users',
        tema: 'purple'
      },
      {
        titulo: 'Paróquias',
        valor: base.totalParoquias,
        subtitulo: 'Comunidades cadastradas',
        icone: 'fa-solid fa-church',
        tema: 'green'
      },
      {
        titulo: 'Usuários do sistema',
        valor: base.totalUsuariosSistema,
        subtitulo: 'Acessos administrativos e operacionais',
        icone: 'fa-solid fa-user-shield',
        tema: 'slate'
      }
    ];
  });

  readonly cardsEvento = computed<DashboardCard[]>(() => {
    const evento = this.evento();

    if (!evento) {
      return [];
    }

    return [
      {
        titulo: 'Tios carona ativos',
        valor: evento.totalTiosCaronaAtivos,
        subtitulo: `${evento.totalTiosCarona} vinculado(s) ao evento`,
        icone: 'fa-solid fa-car-side',
        tema: 'cyan'
      },
      {
        titulo: 'Duplas ativas',
        valor: evento.totalDuplasAtivas,
        subtitulo: `${evento.totalDuplas} dupla(s) cadastrada(s)`,
        icone: 'fa-solid fa-people-arrows',
        tema: 'purple'
      },
      {
        titulo: 'Encontristas ativos',
        valor: evento.totalEncontristasAtivos,
        subtitulo: `${evento.totalEncontristas} encontrista(s) no evento`,
        icone: 'fa-solid fa-child-reaching',
        tema: 'pink'
      },
      {
        titulo: 'Credenciais ativas',
        valor: evento.credenciaisAtivas,
        subtitulo: `${evento.totalCredenciais} credencial(is) emitida(s)`,
        icone: 'fa-solid fa-id-card',
        tema: 'green'
      },
      {
        titulo: 'Cadernos entregues',
        valor: evento.cadernosEntreguesAoSobrinho,
        subtitulo: `${evento.totalCadernos} Caderno(s) de Mensagens`,
        icone: 'fa-solid fa-book-open-reader',
        tema: 'amber'
      },
      {
        titulo: 'Presenças atuais',
        valor: evento.presencasPresentes,
        subtitulo: `${evento.presencasAusentes} ausente(s), ${evento.presencasDesistentes} desistente(s)`,
        icone: 'fa-solid fa-user-check',
        tema: 'blue'
      }
    ];
  });

  readonly metricasEvento = computed<DashboardProgressMetric[]>(() => {
    const evento = this.evento();

    if (!evento) {
      return [];
    }

    return [
      {
        titulo: 'Credenciais prontas',
        descricao: 'Credenciais ativas em relação aos tios e encontristas ativos.',
        valor: evento.credenciaisAtivas,
        total: evento.totalTiosCaronaAtivos + evento.totalEncontristasAtivos,
        percentual: this.percentual(evento.credenciaisAtivas, evento.totalTiosCaronaAtivos + evento.totalEncontristasAtivos),
        tema: 'green'
      },
      {
        titulo: 'Cadernos entregues ao encontrista',
        descricao: 'Cadernos que chegaram ao final do fluxo.',
        valor: evento.cadernosEntreguesAoSobrinho,
        total: evento.totalCadernos,
        percentual: this.percentual(evento.cadernosEntreguesAoSobrinho, evento.totalCadernos),
        tema: 'amber'
      },
      {
        titulo: 'Encontristas presentes',
        descricao: 'Última situação de presença registrada por encontrista.',
        valor: evento.presencasPresentes,
        total: evento.totalEncontristasAtivos,
        percentual: this.percentual(evento.presencasPresentes, evento.totalEncontristasAtivos),
        tema: 'blue'
      },
      {
        titulo: 'Tios com check-in',
        descricao: 'Tios carona dentro da operação neste momento.',
        valor: evento.tiosComCheckin,
        total: evento.totalTiosCaronaAtivos,
        percentual: this.percentual(evento.tiosComCheckin, evento.totalTiosCaronaAtivos),
        tema: 'cyan'
      }
    ];
  });

  readonly presencasPorDia = computed<PresencaDiaStacked[]>(() => {
    const evento = this.evento();

    if (!evento) {
      return [];
    }

    const dias = this.diasDoEvento(evento.dataInicio, evento.dataFim);
    const total = evento.totalEncontristasAtivos;

    if (dias.length === 0 || total === 0) {
      return [];
    }

    return dias.map(data => this.montarPresencaDia(data, total));
  });

  readonly presencasForaPeriodo = computed(() => {
    const evento = this.evento();

    if (!evento) {
      return 0;
    }

    const diasEvento = new Set(this.diasDoEvento(evento.dataInicio, evento.dataFim));

    if (diasEvento.size === 0) {
      return 0;
    }

    return this.presencasEvento()
      .filter(presenca => {
        const dataOcorrencia = this.dataOcorrenciaPresenca(presenca);
        return !!dataOcorrencia && !diasEvento.has(dataOcorrencia);
      })
      .length;
  });

  readonly textoSituacaoAtualPresencas = computed(() => {
    const evento = this.evento();

    if (!evento) {
      return '';
    }

    return `${evento.presencasPresentes} presente(s), ${evento.presencasAusentes} ausente(s), ${evento.presencasDesistentes} desistente(s)`;
  });


  readonly acoes = computed<DashboardAction[]>(() => {
    const evento = this.evento();

    if (!evento) {
      return [
        {
          titulo: 'Cadastrar evento',
          descricao: 'Crie o primeiro evento para liberar a operação.',
          icone: 'fa-solid fa-calendar-plus',
          routerLink: '/eventos',
          tema: 'blue'
        },
        {
          titulo: 'Cadastrar pessoas',
          descricao: 'Mantenha a base de tios, encontristas e equipe.',
          icone: 'fa-solid fa-users',
          routerLink: '/pessoas',
          tema: 'purple'
        }
      ];
    }

    return [
      {
        titulo: 'Gestão do evento',
        descricao: 'Tios, duplas, encontristas e vínculos.',
        icone: 'fa-solid fa-clipboard-list',
        routerLink: ['/eventos', evento.id, 'gestao'],
        tema: 'purple'
      },
      {
        titulo: 'Operação do evento',
        descricao: 'Check-in, presença, Caderno de Mensagens e leituras.',
        icone: 'fa-solid fa-qrcode',
        routerLink: ['/eventos', evento.id, 'operacao'],
        tema: 'green'
      },
      {
        titulo: 'Credenciais',
        descricao: 'Gerar, consultar e imprimir QR codes e crachás.',
        icone: 'fa-solid fa-id-card-clip',
        routerLink: ['/eventos', evento.id, 'credenciais'],
        tema: 'cyan'
      },
      {
        titulo: 'Eventos',
        descricao: 'Editar dados gerais e monitoramento.',
        icone: 'fa-solid fa-calendar-days',
        routerLink: '/eventos',
        tema: 'blue'
      }
    ];
  });

  ngOnInit(): void {
    this.carregarEventos();
    this.carregarDashboard();
  }

  carregarDashboard(eventoId = this.eventoSelecionadoId()): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.dashboardService.carregarResumo(eventoId)
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: resumo => {
          this.resumo.set(resumo);

          const idSelecionado = eventoId ?? resumo.eventoSelecionadoId ?? resumo.evento?.id ?? null;
          this.eventoSelecionadoId.set(idSelecionado);
          this.carregarPresencas(idSelecionado);
        },
        error: erro => {
          console.error('Erro ao carregar dashboard', erro);
          this.erro.set('Não foi possível carregar os indicadores do dashboard.');
        }
      });
  }

  alterarEvento(eventoId: number | null): void {
    this.eventoSelecionadoId.set(eventoId);
    this.presencasEvento.set([]);
    this.carregarDashboard(eventoId);
  }

  usarEventoSugerido(): void {
    this.eventoSelecionadoId.set(null);
    this.presencasEvento.set([]);
    this.carregarDashboard(null);
  }

  classeTemaCard(tema: DashboardCardTheme): string {
    return `theme-${tema}`;
  }

  badgeStatusEvento(): TagSeverity {
    switch (this.evento()?.status) {
      case 'EM_ANDAMENTO':
        return 'success';
      case 'PLANEJADO':
        return 'info';
      case 'CONCLUIDO':
        return 'secondary';
      case 'CANCELADO':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  labelStatusEvento(): string {
    switch (this.evento()?.status) {
      case 'EM_ANDAMENTO':
        return 'Em andamento';
      case 'PLANEJADO':
        return 'Planejado';
      case 'CONCLUIDO':
        return 'Concluído';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return 'Não informado';
    }
  }

  periodoEvento(evento: DashboardEventoResumo): string {
    const inicio = this.formatarData(evento.dataInicio);
    const fim = this.formatarData(evento.dataFim);

    if (!inicio && !fim) {
      return 'Período não informado';
    }

    if (inicio === fim || !fim) {
      return inicio;
    }

    return `${inicio} a ${fim}`;
  }

  dataAtualizacao(): string {
    const geradoEm = this.resumo()?.geradoEm;

    if (!geradoEm) {
      return 'Ainda não atualizado';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(geradoEm));
  }

  operacaoPronta(): boolean {
    const evento = this.evento();

    if (!evento) {
      return false;
    }

    const pessoasOperacionais = evento.totalTiosCaronaAtivos + evento.totalEncontristasAtivos;

    return pessoasOperacionais > 0 && evento.credenciaisAtivas >= pessoasOperacionais;
  }

  percentual(valor: number, total: number): number {
    if (!total || total <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((valor / total) * 100));
  }

  private carregarEventos(): void {
    this.carregandoEventos.set(true);

    this.dashboardService.listarEventos()
      .pipe(finalize(() => this.carregandoEventos.set(false)))
      .subscribe({
        next: eventos => this.eventos.set(eventos ?? []),
        error: erro => {
          console.warn('Dashboard: não foi possível carregar a lista de eventos.', erro);
          this.eventos.set([]);
        }
      });
  }

  private carregarPresencas(eventoId: number | null): void {
    this.presencasEvento.set([]);

    if (!eventoId) {
      return;
    }

    this.carregandoPresencas.set(true);

    this.dashboardService.listarPresencasEvento(eventoId)
      .pipe(finalize(() => this.carregandoPresencas.set(false)))
      .subscribe({
        next: presencas => this.presencasEvento.set(presencas ?? []),
        error: erro => {
          console.warn('Dashboard: não foi possível carregar presenças por dia.', erro);
          this.presencasEvento.set([]);
        }
      });
  }

  private dataOcorrenciaPresenca(presenca: DashboardSobrinhoPresenca): string {
    return String(presenca.ocorridoEm ?? '').substring(0, 10);
  }

  private montarPresencaDia(data: string, total: number): PresencaDiaStacked {
    const statusPorSobrinho = new Map<number, DashboardStatusPresenca>();

    this.presencasEvento()
      .filter(presenca => this.dataOcorrenciaPresenca(presenca) === data)
      .sort((a, b) => String(a.ocorridoEm ?? '').localeCompare(String(b.ocorridoEm ?? '')))
      .forEach(presenca => {
        const sobrinhoId = Number(presenca.sobrinhoId);
        const status = presenca.status as DashboardStatusPresenca;

        if (!sobrinhoId || !['PRESENTE', 'AUSENTE', 'DESISTENTE'].includes(status)) {
          return;
        }

        statusPorSobrinho.set(sobrinhoId, status);
      });

    let presentes = 0;
    let ausentes = 0;
    let desistentes = 0;

    statusPorSobrinho.forEach(status => {
      if (status === 'PRESENTE') {
        presentes++;
      } else if (status === 'AUSENTE') {
        ausentes++;
      } else if (status === 'DESISTENTE') {
        desistentes++;
      }
    });

    const registrados = presentes + ausentes + desistentes;
    const semRegistro = Math.max(0, total - registrados);

    return {
      data,
      label: this.formatarData(data),
      presentes,
      ausentes,
      desistentes,
      semRegistro,
      total,
      percentualPresentes: this.percentual(presentes, total),
      percentualAusentes: this.percentual(ausentes, total),
      percentualDesistentes: this.percentual(desistentes, total),
      percentualSemRegistro: this.percentual(semRegistro, total)
    };
  }

  private diasDoEvento(dataInicio: string | null | undefined, dataFim: string | null | undefined): string[] {
    if (!dataInicio) {
      return [];
    }

    const inicio = new Date(`${dataInicio.substring(0, 10)}T00:00:00`);
    const fim = dataFim
      ? new Date(`${dataFim.substring(0, 10)}T00:00:00`)
      : new Date(inicio);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || fim < inicio) {
      return [];
    }

    const datas: string[] = [];
    const cursor = new Date(inicio);

    while (cursor <= fim) {
      datas.push(cursor.toISOString().substring(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }

    return datas;
  }

  private labelEventoOpcao(evento: DashboardEventoOpcao): string {
    const data = this.formatarData(this.dataReferenciaEvento(evento));
    const status = this.labelStatusEventoOpcao(evento.status);

    return data
      ? `${evento.nome} · ${data} · ${status}`
      : `${evento.nome} · ${status}`;
  }

  private labelStatusEventoOpcao(status: string | null | undefined): string {
    switch (status) {
      case 'EM_ANDAMENTO':
        return 'Em andamento';
      case 'PLANEJADO':
        return 'Planejado';
      case 'CONCLUIDO':
        return 'Concluído';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return 'Status não informado';
    }
  }

  private dataReferenciaEvento(evento: DashboardEventoOpcao): string {
    return String(evento.dataInicio ?? evento.dataFim ?? '');
  }

  private formatarData(data: string | null | undefined): string {
    if (!data) {
      return '';
    }

    const [ano, mes, dia] = data.substring(0, 10).split('-');

    if (!ano || !mes || !dia) {
      return data;
    }

    return `${dia}/${mes}/${ano}`;
  }
}
