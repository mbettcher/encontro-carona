import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

import { Evento, Pessoa, Sobrinho } from '../../shared/models';
import {
  DashboardBaseResumo,
  DashboardEventoResumo,
  DashboardService
} from './dashboard.service';

type DashboardCardTheme =
  | 'blue'
  | 'green'
  | 'purple'
  | 'pink'
  | 'amber'
  | 'red'
  | 'cyan'
  | 'slate';

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

  readonly carregandoBase = signal(false);
  readonly carregandoEvento = signal(false);
  readonly base = signal<DashboardBaseResumo>({ eventos: [], pessoas: [] });
  readonly resumoEvento = signal<DashboardEventoResumo | null>(null);
  readonly eventoSelecionadoId = signal<number | null>(null);

  readonly opcoesEvento = computed(() =>
    this.eventosOrdenados().map(evento => ({
      label: this.labelEvento(evento),
      value: evento.id
    }))
  );

  readonly eventosOrdenados = computed(() =>
    [...this.base().eventos].sort((a, b) =>
      this.dataReferenciaEvento(b).localeCompare(this.dataReferenciaEvento(a))
    )
  );

  readonly eventoSelecionado = computed(() => {
    const eventoId = this.eventoSelecionadoId();

    if (!eventoId) {
      return null;
    }

    return this.base().eventos.find(evento => evento.id === eventoId) ?? null;
  });

  readonly cardsGerais = computed<DashboardCard[]>(() => {
    const eventos = this.base().eventos;
    const pessoas = this.base().pessoas;
    const eventosAtivos = eventos.filter(evento => this.statusEvento(evento) === 'ATIVO').length;
    const pessoasTioCarona = pessoas.filter(pessoa => this.tipoPessoa(pessoa) === 'TIO_CARONA').length;
    const pessoasEncontristas = pessoas.filter(pessoa => this.tipoPessoa(pessoa) === 'SOBRINHO').length;

    return [
      {
        titulo: 'Eventos cadastrados',
        valor: eventos.length,
        subtitulo: `${eventosAtivos} ativo(s) no sistema`,
        icone: 'fa-solid fa-calendar-days',
        tema: 'blue'
      },
      {
        titulo: 'Pessoas cadastradas',
        valor: pessoas.length,
        subtitulo: 'Base geral de participantes',
        icone: 'fa-solid fa-users',
        tema: 'purple'
      },
      {
        titulo: 'Tios carona',
        valor: pessoasTioCarona,
        subtitulo: 'Pessoas aptas para carona',
        icone: 'fa-solid fa-car-side',
        tema: 'cyan'
      },
      {
        titulo: 'Encontristas',
        valor: pessoasEncontristas,
        subtitulo: 'Pessoas do tipo encontrista',
        icone: 'fa-solid fa-child-reaching',
        tema: 'pink'
      }
    ];
  });

  readonly cardsEvento = computed<DashboardCard[]>(() => {
    const resumo = this.resumoEvento();

    if (!resumo) {
      return [];
    }

    const tiosAtivos = resumo.tiosCarona.filter(tio => this.statusGenerico(tio) === 'ATIVO').length;
    const duplasAtivas = resumo.duplas.filter(dupla => this.statusGenerico(dupla) === 'ATIVA').length;
    const encontristasPresentes = resumo.encontristas.filter(encontrista => this.statusEncontrista(encontrista) === 'PRESENTE').length;
    const vinculosAtivos = resumo.vinculos.filter(vinculo => this.statusGenerico(vinculo) === 'ATIVO').length;
    const credenciaisAtivas = resumo.credenciais.filter(credencial => credencial.status === 'ATIVA').length;
    const cadernosPendentes = resumo.cadernos.filter(caderno => caderno.status === 'PENDENTE').length;

    return [
      {
        titulo: 'Tios no evento',
        valor: tiosAtivos,
        subtitulo: `${resumo.tiosCarona.length} vinculado(s) ao evento`,
        icone: 'fa-solid fa-car-side',
        tema: 'cyan'
      },
      {
        titulo: 'Duplas ativas',
        valor: duplasAtivas,
        subtitulo: `${resumo.duplas.length} dupla(s) cadastrada(s)`,
        icone: 'fa-solid fa-people-arrows',
        tema: 'purple'
      },
      {
        titulo: 'Encontristas',
        valor: resumo.encontristas.length,
        subtitulo: `${encontristasPresentes} presente(s)`,
        icone: 'fa-solid fa-child-reaching',
        tema: 'pink'
      },
      {
        titulo: 'Vínculos ativos',
        valor: vinculosAtivos,
        subtitulo: 'Encontristas ligados às duplas',
        icone: 'fa-solid fa-link',
        tema: 'blue'
      },
      {
        titulo: 'Credenciais ativas',
        valor: credenciaisAtivas,
        subtitulo: `${resumo.credenciais.length} gerada(s) no total`,
        icone: 'fa-solid fa-id-card',
        tema: 'green'
      },
      {
        titulo: 'Cadernos pendentes',
        valor: cadernosPendentes,
        subtitulo: `${resumo.cadernos.length} caderno(s) gerado(s)`,
        icone: 'fa-solid fa-book',
        tema: cadernosPendentes > 0 ? 'red' : 'amber'
      }
    ];
  });

  readonly progressoCredenciais = computed(() => {
    const resumo = this.resumoEvento();

    if (!resumo) {
      return 0;
    }

    const totalEsperado = resumo.tiosCarona.filter(tio => this.statusGenerico(tio) === 'ATIVO').length +
      resumo.encontristas.filter(encontrista => this.statusEncontrista(encontrista) !== 'DESISTENTE').length;

    if (totalEsperado === 0) {
      return 0;
    }

    const ativas = resumo.credenciais.filter(credencial => credencial.status === 'ATIVA').length;

    return Math.min(100, Math.round((ativas / totalEsperado) * 100));
  });

  readonly progressoPresenca = computed(() => {
    const resumo = this.resumoEvento();

    if (!resumo || resumo.encontristas.length === 0) {
      return 0;
    }

    const presentes = resumo.encontristas.filter(encontrista => this.statusEncontrista(encontrista) === 'PRESENTE').length;

    return Math.round((presentes / resumo.encontristas.length) * 100);
  });

  readonly operacaoPronta = computed(() => {
    const resumo = this.resumoEvento();

    if (!resumo) {
      return false;
    }

    return resumo.tiosCarona.some(tio => this.statusGenerico(tio) === 'ATIVO') &&
      resumo.duplas.some(dupla => this.statusGenerico(dupla) === 'ATIVA') &&
      resumo.encontristas.length > 0 &&
      resumo.credenciais.some(credencial => credencial.status === 'ATIVA');
  });

  readonly acoesRapidas = computed<DashboardAction[]>(() => {
    const eventoId = this.eventoSelecionadoId();

    return [
      {
        titulo: 'Gestão do evento',
        descricao: 'Tios, duplas, encontristas e vínculos.',
        icone: 'fa-solid fa-users-gear',
        routerLink: eventoId ? ['/eventos', eventoId, 'gestao'] : '/eventos',
        tema: 'blue'
      },
      {
        titulo: 'Operação',
        descricao: 'Check-in, presença e Caderno do Choro.',
        icone: 'fa-solid fa-qrcode',
        routerLink: eventoId ? ['/eventos', eventoId, 'operacao'] : '/eventos',
        tema: 'green'
      },
      {
        titulo: 'Credenciais',
        descricao: 'Gerar, filtrar e imprimir crachás.',
        icone: 'fa-solid fa-id-card',
        routerLink: eventoId ? ['/eventos', eventoId, 'credenciais'] : '/eventos',
        tema: 'purple'
      },
      {
        titulo: 'Cadastrar pessoa',
        descricao: 'Adicionar tios carona e encontristas.',
        icone: 'fa-solid fa-user-plus',
        routerLink: '/pessoas',
        tema: 'pink'
      }
    ];
  });

  ngOnInit(): void {
    this.carregarDashboard();
  }

  carregarDashboard(): void {
    this.carregandoBase.set(true);

    this.dashboardService.carregarBase()
      .pipe(finalize(() => this.carregandoBase.set(false)))
      .subscribe({
        next: base => {
          this.base.set(base);

          const eventoAtual = this.eventoSelecionadoId();
          const eventoId = eventoAtual && base.eventos.some(evento => evento.id === eventoAtual)
            ? eventoAtual
            : this.eventosOrdenados()[0]?.id ?? null;

          this.eventoSelecionadoId.set(eventoId);

          if (eventoId) {
            this.carregarResumoEvento(eventoId);
          } else {
            this.resumoEvento.set(null);
          }
        },
        error: erro => {
          console.error('Erro ao carregar dashboard', erro);
          this.base.set({ eventos: [], pessoas: [] });
          this.resumoEvento.set(null);
        }
      });
  }

  alterarEvento(eventoId: number | null): void {
    this.eventoSelecionadoId.set(eventoId);

    if (!eventoId) {
      this.resumoEvento.set(null);
      return;
    }

    this.carregarResumoEvento(eventoId);
  }

  badgeOperacao(): 'success' | 'warn' {
    return this.operacaoPronta() ? 'success' : 'warn';
  }

  labelOperacao(): string {
    return this.operacaoPronta() ? 'Operação pronta' : 'Preparação pendente';
  }

  classeTemaCard(tema: DashboardCardTheme): string {
    return `theme-${tema}`;
  }

  private carregarResumoEvento(eventoId: number): void {
    this.carregandoEvento.set(true);

    this.dashboardService.carregarEvento(eventoId)
      .pipe(finalize(() => this.carregandoEvento.set(false)))
      .subscribe({
        next: resumo => this.resumoEvento.set(resumo),
        error: erro => {
          console.error('Erro ao carregar resumo do evento', erro);
          this.resumoEvento.set(null);
        }
      });
  }

  private labelEvento(evento: Evento): string {
    const data = this.dataReferenciaEvento(evento);

    if (!data) {
      return evento.nome;
    }

    return `${evento.nome} · ${this.formatarDataCurta(data)}`;
  }

  private dataReferenciaEvento(evento: Evento): string {
    return String((evento as { dataInicio?: string; inicio?: string; data?: string }).dataInicio ??
      (evento as { dataInicio?: string; inicio?: string; data?: string }).inicio ??
      (evento as { dataInicio?: string; inicio?: string; data?: string }).data ??
      '');
  }

  private formatarDataCurta(valor: string): string {
    if (!valor) {
      return '';
    }

    const [ano, mes, dia] = valor.substring(0, 10).split('-');

    if (!ano || !mes || !dia) {
      return valor;
    }

    return `${dia}/${mes}/${ano}`;
  }

  private statusEvento(evento: Evento): string {
    return String((evento as { status?: string }).status ?? '').toUpperCase();
  }

  private tipoPessoa(pessoa: Pessoa): string {
    return String((pessoa as { tipo?: string; tipoPessoa?: string }).tipo ??
      (pessoa as { tipo?: string; tipoPessoa?: string }).tipoPessoa ??
      '').toUpperCase();
  }

  private statusGenerico(item: unknown): string {
    return String((item as { status?: string }).status ?? '').toUpperCase();
  }

  private statusEncontrista(encontrista: Sobrinho): string {
    return String(encontrista.statusAtualPresenca || encontrista.status || '').toUpperCase();
  }
}
