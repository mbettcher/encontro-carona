
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
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
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';

import {
  CadernoChoro,
  CadernoChoroHistorico,
  DuplaTioCarona,
  Evento,
  OperacaoPresencaSobrinho,
  Sobrinho,
  SobrinhoDupla,
  StatusCadernoChoro,
  TioCaronaEvento
} from '../../shared/models';
import { AuthService } from '../../core/auth/auth.service';
import { EventoOperacaoService } from './evento-operacao.service';

type OperacaoCadernoChoro =
  | 'CONFERIDO'
  | 'ANEXADO_AO_KIT'
  | 'ENTREGUE_AO_SOBRINHO'
  | 'PERDIDO'
  | 'SUBSTITUIDO'
  | 'CANCELADO';

type TipoListaPresenca = 'ENCONTRISTAS' | 'TIOS_CARONA';

type AbaOperacao =
  | 'VISAO_GERAL'
  | 'LEITURAS_QR'
  | 'TIOS_CARONA'
  | 'SOBRINHOS'
  | 'CADERNO_CHORO';


interface OpcaoStatusCaderno {
  label: string;
  value: StatusCadernoChoro;
}

interface OpcaoEquipeCaderno {
  label: string;
  value: number;
  cor?: string;
}

interface ResumoEquipeCaderno {
  id: number | null;
  apelido: string;
  cor?: string;
  total: number;
  direcionados: number;
  conferidos: number;
  noKit: number;
  entregues: number;
}

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
    DialogModule,
    TextareaModule,
    TooltipModule,
    TagModule,
    TabsModule
  ],
  templateUrl: './evento-operacao.component.html',
  styleUrl: './evento-operacao.component.scss'
})
export class EventoOperacaoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly seguranca = inject(AuthService);

  private readonly service = inject(EventoOperacaoService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  readonly eventoId = Number(this.route.snapshot.paramMap.get('eventoId'));

  readonly tiosCarona = signal<TioCaronaEvento[]>([]);
  readonly duplas = signal<DuplaTioCarona[]>([]);
  readonly sobrinhos = signal<Sobrinho[]>([]);
  readonly vinculos = signal<SobrinhoDupla[]>([]);
  readonly cadernos = signal<CadernoChoro[]>([]);
  readonly carregando = signal(false);
  readonly processandoCodigo = signal(false);
  readonly evento = signal<Evento | null>(null);
  readonly processandoManual = signal<number | null>(null);
  readonly processandoPresencaSobrinho = signal<number | null>(null);
  readonly filtroTiosOperacao = signal('');
  readonly filtroPresencaSobrinhos = signal('');
  readonly filtroSobrinhosEvento = signal('');
  readonly filtroCadernos = signal('');
  readonly duplaCadernoSelecionada = signal<number | null>(null);
  readonly equipeCadernoSelecionada = signal<number | null>(null);
  readonly statusCadernoSelecionado = signal<StatusCadernoChoro | null>(null);
  readonly processandoCadernos = signal(false);
  readonly processandoCadernoId = signal<number | null>(null);
  readonly baixandoRelatorioCadernos = signal(false);
  readonly baixandoListaPresenca = signal<TipoListaPresenca | null>(null);
  readonly cadernoSelecionado = signal<CadernoChoro | null>(null);
  readonly historicoCaderno = signal<CadernoChoroHistorico[]>([]);
  readonly historicoCadernoVisivel = signal(false);
  readonly carregandoHistoricoCaderno = signal(false);
  readonly operacaoCadernoVisivel = signal(false);
  readonly operacaoCadernoPendente = signal<OperacaoCadernoChoro | null>(null);
  readonly observacaoOperacaoCaderno = signal('');
  readonly acoesEspeciaisCadernoVisivel = signal(false);
  readonly processandoCodigoSobrinho = signal(false);
  readonly abaOperacaoAtiva = signal<AbaOperacao>('VISAO_GERAL');

  readonly historicoCadernoTimeline = computed(() =>
    [...this.historicoCaderno()].reverse()
  );

  readonly codigoForm = this.fb.nonNullable.group({
    codigoIdentificacao: ['', [Validators.required, Validators.maxLength(80)]],
    tipoOperacao: ['CHECKIN' as 'CHECKIN' | 'CHECKOUT', [Validators.required]]
  });

  readonly codigoSobrinhoForm = this.fb.nonNullable.group({
    codigoIdentificacao: ['', [Validators.required, Validators.maxLength(80)]],
    operacao: ['PRESENTE' as OperacaoPresencaSobrinho, [Validators.required]]
  });

  readonly tiosAtivos = computed(() =>
    this.tiosCarona().filter(tio => tio.status === 'ATIVO')
  );

  readonly tiosComCredencialOperacional = computed(() =>
    this.tiosAtivos().filter(tio => this.credencialPermiteOperacao(tio))
  );

  readonly tiosSemCredencialOperacional = computed(() =>
    this.tiosAtivos().filter(tio => !this.credencialPermiteOperacao(tio))
  );

  readonly tiosAguardandoCheckin = computed(() =>
    this.tiosComCredencialOperacional().filter(tio =>
      !tio.statusOperacional || tio.statusOperacional === 'AGUARDANDO_CHECKIN'
    )
  );

  readonly tiosComCheckin = computed(() =>
    this.tiosComCredencialOperacional().filter(tio => tio.statusOperacional === 'COM_CHECKIN')
  );

  readonly tiosComCheckout = computed(() =>
    this.tiosComCredencialOperacional().filter(tio => tio.statusOperacional === 'COM_CHECKOUT')
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

  readonly opcoesDuplasCaderno = computed(() =>
    this.duplasAtivas().map(dupla => ({
      label: dupla.apelido || dupla.codigo,
      descricao: `${dupla.tio1Nome} e ${dupla.tio2Nome}`,
      value: dupla.id
    }))
  );


  readonly opcoesEquipesCaderno = computed<OpcaoEquipeCaderno[]>(() => {
    const equipes = new Map<number, OpcaoEquipeCaderno>();

    this.cadernos()
      .filter(caderno => !!caderno.equipeMontagemKitId)
      .forEach(caderno => {
        const id = Number(caderno.equipeMontagemKitId);

        if (!equipes.has(id)) {
          equipes.set(id, {
            value: id,
            label: caderno.equipeMontagemKitApelido || `Equipe ${id}`,
            cor: caderno.equipeMontagemKitCorIdentificacao
          });
        }
      });

    return Array.from(equipes.values())
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  });

  readonly opcoesStatusCaderno: OpcaoStatusCaderno[] = [
    { label: 'Pendente', value: 'PENDENTE' },
    { label: 'Com a dupla', value: 'ENTREGUE_A_DUPLA' },
    { label: 'Direcionado à equipe', value: 'DIRECIONADO_EQUIPE_MONTAGEM' },
    { label: 'Conferido', value: 'CONFERIDO' },
    { label: 'Anexado ao kit', value: 'ANEXADO_AO_KIT' },
    { label: 'Entregue ao encontrista', value: 'ENTREGUE_AO_SOBRINHO' },
    { label: 'Ocorrências', value: 'PERDIDO' },
    { label: 'Cancelado', value: 'CANCELADO' }
  ];

  readonly resumoEquipesCaderno = computed<ResumoEquipeCaderno[]>(() => {
    const resumo = new Map<number | null, ResumoEquipeCaderno>();

    this.cadernos()
      .filter(caderno => ['DIRECIONADO_EQUIPE_MONTAGEM', 'CONFERIDO', 'ANEXADO_AO_KIT', 'ENTREGUE_AO_SOBRINHO'].includes(caderno.status))
      .forEach(caderno => {
        const id = caderno.equipeMontagemKitId ?? null;
        const chave = id;
        const item = resumo.get(chave) ?? {
          id,
          apelido: caderno.equipeMontagemKitApelido || 'Sem equipe',
          cor: caderno.equipeMontagemKitCorIdentificacao,
          total: 0,
          direcionados: 0,
          conferidos: 0,
          noKit: 0,
          entregues: 0
        };

        item.total++;

        if (caderno.status === 'DIRECIONADO_EQUIPE_MONTAGEM') {
          item.direcionados++;
        }

        if (caderno.status === 'CONFERIDO') {
          item.conferidos++;
        }

        if (caderno.status === 'ANEXADO_AO_KIT') {
          item.noKit++;
        }

        if (caderno.status === 'ENTREGUE_AO_SOBRINHO') {
          item.entregues++;
        }

        resumo.set(chave, item);
      });

    return Array.from(resumo.values())
      .sort((a, b) => a.apelido.localeCompare(b.apelido, 'pt-BR'));
  });

  readonly cadernosComEquipe = computed(() =>
    this.cadernos().filter(caderno => !!caderno.equipeMontagemKitId)
  );

  readonly cadernosDirecionadosEquipe = computed(() =>
    this.cadernos().filter(caderno => caderno.status === 'DIRECIONADO_EQUIPE_MONTAGEM')
  );

  readonly cadernosFiltrados = computed(() => {
    const filtro = this.normalizarFiltro(this.filtroCadernos());
    const duplaId = this.duplaCadernoSelecionada();
    const equipeId = this.equipeCadernoSelecionada();
    const statusSelecionado = this.statusCadernoSelecionado();

    return this.cadernos()
      .filter(caderno => !duplaId || caderno.duplaId === duplaId)
      .filter(caderno => !equipeId || caderno.equipeMontagemKitId === equipeId)
      .filter(caderno => !statusSelecionado || this.statusCadernoAgrupa(caderno.status, statusSelecionado))
      .filter(caderno => {
        if (!filtro) {
          return true;
        }

        return this.contemFiltro(caderno.sobrinhoNome, filtro) ||
          this.contemFiltro(caderno.duplaCodigo, filtro) ||
          this.contemFiltro(caderno.duplaApelido, filtro) ||
          this.contemFiltro(caderno.tio1Nome, filtro) ||
          this.contemFiltro(caderno.tio2Nome, filtro) ||
          this.contemFiltro(caderno.status, filtro) ||
          this.contemFiltro(caderno.equipeMontagemKitApelido, filtro) ||
          this.contemFiltro(this.labelStatusCaderno(caderno.status), filtro);
      });
  });

  readonly cadernosPendentes = computed(() =>
    this.cadernos().filter(caderno => caderno.status === 'PENDENTE')
  );

  readonly cadernosEntreguesADupla = computed(() =>
    this.cadernos().filter(caderno => caderno.status === 'ENTREGUE_A_DUPLA')
  );

  readonly cadernosRecebidosDaDupla = computed(() =>
    this.cadernos().filter(caderno => caderno.status === 'RECEBIDO_DA_DUPLA' || caderno.status === 'DIRECIONADO_EQUIPE_MONTAGEM')
  );

  readonly cadernosConferidos = computed(() =>
    this.cadernos().filter(caderno => caderno.status === 'CONFERIDO')
  );

  readonly cadernosNoKit = computed(() =>
    this.cadernos().filter(caderno => caderno.status === 'ANEXADO_AO_KIT')
  );

  readonly cadernosEntreguesAoSobrinho = computed(() =>
    this.cadernos().filter(caderno => caderno.status === 'ENTREGUE_AO_SOBRINHO')
  );

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

  readonly totalCadernosProblematicos = computed(() =>
    this.cadernos().filter(caderno =>
      ['PERDIDO', 'SUBSTITUIDO', 'CANCELADO'].includes(caderno.status)
    ).length
  );

  readonly totalCredenciaisOperacionais = computed(() =>
    this.tiosAtivos().length + this.sobrinhos().length
  );

  readonly totalPendenciasOperacionais = computed(() => {
    let total = 0;

    if (this.percentualVinculados() < 100) {
      total++;
    }

    if (this.tiosAguardandoCheckin().length > 0) {
      total++;
    }

    if (this.sobrinhosInscritos().length > 0) {
      total++;
    }

    if (this.cadernosPendentes().length > 0) {
      total++;
    }

    return total;
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
    this.carregarCadernos();

    window.setTimeout(() => this.carregando.set(false), 600);
  }

  private carregarCadernos(): void {
    this.service.listarCadernos(this.eventoId).subscribe({
      next: cadernos => this.cadernos.set(cadernos),
      error: erro => {
        console.error('Erro ao carregar cadernos de mensagens', erro);
        this.toastError('Não foi possível carregar os cadernos de mensagens.');
      }
    });
  }

  alterarAbaOperacao(aba: string | number | undefined): void {
    this.abaOperacaoAtiva.set(aba as AbaOperacao);
  }

  alterarFiltroCadernos(valor: string): void {
    this.filtroCadernos.set(valor);
  }

  alterarDuplaCadernoSelecionada(duplaId: number | null): void {
    this.duplaCadernoSelecionada.set(duplaId);
  }


  alterarEquipeCadernoSelecionada(equipeId: number | null): void {
    this.equipeCadernoSelecionada.set(equipeId);
  }

  alterarStatusCadernoSelecionado(status: StatusCadernoChoro | null): void {
    this.statusCadernoSelecionado.set(status);
  }

  filtrarCadernosPorEquipe(equipeId: number | null): void {
    this.equipeCadernoSelecionada.set(equipeId);
    this.abaOperacaoAtiva.set('CADERNO_CHORO');
  }

  limparFiltrosCaderno(): void {
    this.duplaCadernoSelecionada.set(null);
    this.equipeCadernoSelecionada.set(null);
    this.statusCadernoSelecionado.set(null);
    this.filtroCadernos.set('');
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

  baixarListaPresencaEncontristas(): void {
    this.baixarListaPresenca('ENCONTRISTAS');
  }

  baixarListaPresencaTiosCarona(): void {
    this.baixarListaPresenca('TIOS_CARONA');
  }

  private baixarListaPresenca(tipo: TipoListaPresenca): void {
    if (this.baixandoListaPresenca()) {
      return;
    }

    this.baixandoListaPresenca.set(tipo);

    const requisicao = tipo === 'ENCONTRISTAS'
      ? this.service.baixarListaPresencaEncontristas(this.eventoId, true)
      : this.service.baixarListaPresencaTiosCarona(this.eventoId, true);

    requisicao
      .pipe(finalize(() => this.baixandoListaPresenca.set(null)))
      .subscribe({
        next: arquivo => {
          this.salvarArquivoPdf(
            arquivo,
            this.nomeArquivoListaPresenca(tipo)
          );
        },
        error: erro => {
          console.error('Erro ao baixar lista de presença', erro);
          this.toastError(this.mensagemErro(erro, 'Não foi possível gerar a lista de presença.'));
        }
      });
  }

  private nomeArquivoListaPresenca(tipo: TipoListaPresenca): string {
    const eventoNome = this.evento()?.nome || `evento-${this.eventoId}`;
    const nomeSeguro = eventoNome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    const sufixo = tipo === 'ENCONTRISTAS'
      ? 'encontristas'
      : 'tios-carona';

    return `lista-presenca-${sufixo}-${nomeSeguro || this.eventoId}.pdf`;
  }

  baixarRelatorioCadernosGeral(): void {
    this.baixarRelatorioCadernosEquipes(false);
  }

  baixarRelatorioCadernosFiltrado(): void {
    this.baixarRelatorioCadernosEquipes(true);
  }

  private baixarRelatorioCadernosEquipes(aplicarFiltros: boolean): void {
    if (this.baixandoRelatorioCadernos()) {
      return;
    }

    const filtros = aplicarFiltros
      ? {
        equipeId: this.equipeCadernoSelecionada(),
        status: this.statusCadernoSelecionado()
      }
      : undefined;

    this.baixandoRelatorioCadernos.set(true);

    this.service.baixarRelatorioCadernosEquipes(this.eventoId, filtros)
      .pipe(finalize(() => this.baixandoRelatorioCadernos.set(false)))
      .subscribe({
        next: arquivo => {
          this.salvarArquivoPdf(
            arquivo,
            aplicarFiltros
              ? this.nomeArquivoRelatorioCadernos('filtrado')
              : this.nomeArquivoRelatorioCadernos('geral')
          );
        },
        error: erro => {
          console.error('Erro ao baixar relatório de cadernos por equipe', erro);
          this.toastError(this.mensagemErro(erro, 'Não foi possível gerar o relatório Jasper dos cadernos.'));
        }
      });
  }

  private salvarArquivoPdf(arquivo: Blob, nomeArquivo: string): void {
    const url = window.URL.createObjectURL(arquivo);
    const link = document.createElement('a');

    link.href = url;
    link.download = nomeArquivo;
    link.click();

    window.URL.revokeObjectURL(url);
  }

  private nomeArquivoRelatorioCadernos(tipo: 'geral' | 'filtrado'): string {
    const eventoNome = this.evento()?.nome || `evento-${this.eventoId}`;
    const nomeSeguro = eventoNome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    const sufixo = tipo === 'filtrado' ? 'filtrado' : 'geral';

    return `cadernos-equipes-${nomeSeguro || this.eventoId}-${sufixo}.pdf`;
  }

  gerarCadernos(): void {
    this.processandoCadernos.set(true);

    this.service.gerarCadernos(this.eventoId)
      .pipe(finalize(() => this.processandoCadernos.set(false)))
      .subscribe({
        next: resultado => {
          this.toastSuccess(
            `Cadernos gerados. Criados: ${resultado.criados}. Já existentes: ${resultado.existentes}. Total: ${resultado.total}.`
          );

          this.carregarCadernos();
        },
        error: erro => {
          console.error('Erro ao gerar cadernos', erro);
          this.toastError(this.mensagemErro(erro, 'Não foi possível gerar os cadernos de mensagens.'));
        }
      });
  }

  entregarCadernosADupla(): void {
    const duplaId = this.duplaAlvoEntregaADupla();

    if (!duplaId) {
      this.toastWarn(
        this.duplaCadernoSelecionada()
          ? 'Esta dupla não possui cadernos pendentes para entrega.'
          : 'Selecione uma dupla com cadernos pendentes para entrega.'
      );
      return;
    }

    this.processandoCadernos.set(true);

    this.service.entregarCadernosADupla(this.eventoId, duplaId)
      .pipe(finalize(() => this.processandoCadernos.set(false)))
      .subscribe({
        next: cadernosAtualizados => {
          this.atualizarCadernosNaLista(cadernosAtualizados);
          this.toastSuccess(`${cadernosAtualizados.length} caderno(s) entregue(s) à dupla.`);
        },
        error: erro => {
          console.error('Erro ao entregar cadernos à dupla', erro);
          this.toastError(this.mensagemErro(erro, 'Não foi possível entregar os cadernos à dupla.'));
        }
      });
  }

  receberCadernosDaDupla(): void {
    const duplaId = this.duplaAlvoRecebimentoDaDupla();

    if (!duplaId) {
      this.toastWarn(
        this.duplaCadernoSelecionada()
          ? 'Esta dupla não possui cadernos entregues para receber de volta.'
          : 'Selecione uma dupla com cadernos entregues para receber de volta.'
      );
      return;
    }

    this.processandoCadernos.set(true);

    this.service.receberCadernosDaDupla(this.eventoId, duplaId)
      .pipe(finalize(() => this.processandoCadernos.set(false)))
      .subscribe({
        next: cadernosAtualizados => {
          this.atualizarCadernosNaLista(cadernosAtualizados);
          this.toastSuccess(`${cadernosAtualizados.length} caderno(s) recebido(s) da dupla.`);
        },
        error: erro => {
          console.error('Erro ao receber cadernos da dupla', erro);
          this.toastError(this.mensagemErro(erro, 'Não foi possível receber os cadernos da dupla.'));
        }
      });
  }

  private resolverDuplaAlvoPorStatus(status: StatusCadernoChoro): number | null {
    const duplaSelecionada = this.duplaCadernoSelecionada();

    if (duplaSelecionada) {
      const possuiCadernoNoStatus = this.cadernos().some(caderno =>
        caderno.duplaId === duplaSelecionada &&
        caderno.status === status
      );

      return possuiCadernoNoStatus ? duplaSelecionada : null;
    }

    const idsDuplasElegiveis = Array.from(
      new Set(
        this.cadernos()
          .filter(caderno => caderno.status === status)
          .map(caderno => caderno.duplaId)
      )
    );

    return idsDuplasElegiveis.length === 1 ? idsDuplasElegiveis[0] : null;
  }

  private duplaAlvoEntregaADupla(): number | null {
    return this.resolverDuplaAlvoPorStatus('PENDENTE');
  }

  private duplaAlvoRecebimentoDaDupla(): number | null {
    return this.resolverDuplaAlvoPorStatus('ENTREGUE_A_DUPLA');
  }

  podeEntregarCadernosADuplaEmLote(): boolean {
    return this.duplaAlvoEntregaADupla() !== null;
  }

  podeReceberCadernosDaDuplaEmLote(): boolean {
    return this.duplaAlvoRecebimentoDaDupla() !== null;
  }

  conferirCaderno(caderno: CadernoChoro): void {
    this.abrirOperacaoCaderno(caderno, 'CONFERIDO');
  }

  anexarCadernoAoKit(caderno: CadernoChoro): void {
    this.abrirOperacaoCaderno(caderno, 'ANEXADO_AO_KIT');
  }

  entregarCadernoAoSobrinho(caderno: CadernoChoro): void {
    this.abrirOperacaoCaderno(caderno, 'ENTREGUE_AO_SOBRINHO');
  }

  marcarCadernoPerdido(caderno: CadernoChoro): void {
    this.abrirOperacaoCaderno(caderno, 'PERDIDO');
  }

  marcarCadernoSubstituido(caderno: CadernoChoro): void {
    this.abrirOperacaoCaderno(caderno, 'SUBSTITUIDO');
  }

  cancelarCaderno(caderno: CadernoChoro): void {
    this.abrirOperacaoCaderno(caderno, 'CANCELADO');
  }

  abrirHistoricoCaderno(caderno: CadernoChoro): void {
    this.cadernoSelecionado.set(caderno);
    this.historicoCaderno.set([]);
    this.historicoCadernoVisivel.set(true);
    this.carregandoHistoricoCaderno.set(true);

    this.service.listarHistoricoCaderno(this.eventoId, caderno.id)
      .pipe(finalize(() => this.carregandoHistoricoCaderno.set(false)))
      .subscribe({
        next: historico => this.historicoCaderno.set(historico),
        error: erro => {
          console.error('Erro ao carregar histórico do caderno', erro);
          this.toastError(this.mensagemErro(erro, 'Não foi possível carregar o histórico do caderno.'));
        }
      });
  }

  fecharHistoricoCaderno(): void {
    this.historicoCadernoVisivel.set(false);
    this.historicoCaderno.set([]);
  }

  abrirAcoesEspeciaisCaderno(caderno: CadernoChoro): void {
    this.cadernoSelecionado.set(caderno);
    this.acoesEspeciaisCadernoVisivel.set(true);
  }

  fecharAcoesEspeciaisCaderno(): void {
    this.acoesEspeciaisCadernoVisivel.set(false);
  }

  abrirOperacaoCaderno(caderno: CadernoChoro, operacao: OperacaoCadernoChoro): void {
    this.cadernoSelecionado.set(caderno);
    this.operacaoCadernoPendente.set(operacao);
    this.observacaoOperacaoCaderno.set('');
    this.operacaoCadernoVisivel.set(true);
    this.acoesEspeciaisCadernoVisivel.set(false);
  }

  fecharOperacaoCaderno(): void {
    this.operacaoCadernoVisivel.set(false);
    this.operacaoCadernoPendente.set(null);
    this.observacaoOperacaoCaderno.set('');
  }

  alterarObservacaoOperacaoCaderno(valor: string): void {
    this.observacaoOperacaoCaderno.set(valor);
  }

  confirmarOperacaoCaderno(): void {
    const caderno = this.cadernoSelecionado();
    const operacao = this.operacaoCadernoPendente();

    if (!caderno || !operacao) {
      this.toastWarn('Selecione uma operação válida para o caderno.');
      return;
    }

    this.operarCadernoIndividual(caderno, operacao, this.observacaoOperacaoCaderno());
  }

  private operarCadernoIndividual(
    caderno: CadernoChoro,
    statusDestino: OperacaoCadernoChoro,
    observacao?: string
  ): void {
    this.processandoCadernoId.set(caderno.id);

    const requisicao = (() => {
      switch (statusDestino) {
        case 'CONFERIDO':
          return this.service.conferirCaderno(this.eventoId, caderno.id, observacao);
        case 'ANEXADO_AO_KIT':
          return this.service.anexarCadernoAoKit(this.eventoId, caderno.id, observacao);
        case 'ENTREGUE_AO_SOBRINHO':
          return this.service.entregarCadernoAoSobrinho(this.eventoId, caderno.id, observacao);
        case 'PERDIDO':
          return this.service.marcarCadernoPerdido(this.eventoId, caderno.id, observacao);
        case 'SUBSTITUIDO':
          return this.service.marcarCadernoSubstituido(this.eventoId, caderno.id, observacao);
        case 'CANCELADO':
          return this.service.cancelarCaderno(this.eventoId, caderno.id, observacao);
        default:
          throw new Error('Operação de caderno inválida.');
      }
    })();

    requisicao
      .pipe(finalize(() => this.processandoCadernoId.set(null)))
      .subscribe({
        next: cadernoAtualizado => {
          this.atualizarCadernoNaLista(cadernoAtualizado);
          this.fecharOperacaoCaderno();

          this.toastSuccess(
            `Caderno de mensagens de ${cadernoAtualizado.sobrinhoNome}: ${this.labelStatusCaderno(cadernoAtualizado.status)}.`
          );
        },
        error: erro => {
          console.error('Erro ao operar caderno', erro);
          this.toastError(this.mensagemErro(erro, 'Não foi possível atualizar o caderno de mensagens.'));
        }
      });
  }

  tituloOperacaoCaderno(): string {
    const operacao = this.operacaoCadernoPendente();

    switch (operacao) {
      case 'CONFERIDO':
        return 'Conferir caderno';
      case 'ANEXADO_AO_KIT':
        return 'Anexar caderno ao kit';
      case 'ENTREGUE_AO_SOBRINHO':
        return 'Entregar kit ao encontrista';
      case 'PERDIDO':
        return 'Marcar caderno como perdido';
      case 'SUBSTITUIDO':
        return 'Marcar caderno como substituído';
      case 'CANCELADO':
        return 'Cancelar caderno';
      default:
        return 'Operação do caderno';
    }
  }

  descricaoOperacaoCaderno(): string {
    const operacao = this.operacaoCadernoPendente();

    switch (operacao) {
      case 'CONFERIDO':
        return 'Confirme que a equipe conferiu o conteúdo do caderno de mensagens recebido da dupla.';
      case 'ANEXADO_AO_KIT':
        return 'Confirme que o caderno de mensagens foi anexado ao kit de encerramento.';
      case 'ENTREGUE_AO_SOBRINHO':
        return 'Confirme que o kit final foi entregue ao encontrista no encerramento.';
      case 'PERDIDO':
        return 'Registre a ocorrência de perda do caderno de mensagens. Informe detalhes na observação.';
      case 'SUBSTITUIDO':
        return 'Registre que o caderno de mensagens precisou ser substituído. Informe detalhes na observação.';
      case 'CANCELADO':
        return 'Registre o cancelamento do caderno de mensagens. Use apenas quando ele não deverá seguir no fluxo.';
      default:
        return 'Confirme a operação desejada para o caderno de mensagens.';
    }
  }

  labelBotaoConfirmarOperacaoCaderno(): string {
    const operacao = this.operacaoCadernoPendente();

    switch (operacao) {
      case 'CONFERIDO':
        return 'Confirmar conferência';
      case 'ANEXADO_AO_KIT':
        return 'Confirmar anexação';
      case 'ENTREGUE_AO_SOBRINHO':
        return 'Confirmar entrega';
      case 'PERDIDO':
        return 'Marcar perdido';
      case 'SUBSTITUIDO':
        return 'Marcar substituído';
      case 'CANCELADO':
        return 'Cancelar caderno';
      default:
        return 'Confirmar';
    }
  }

  severityBotaoConfirmarOperacaoCaderno(): 'success' | 'info' | 'warn' | 'danger' {
    const operacao = this.operacaoCadernoPendente();

    switch (operacao) {
      case 'CONFERIDO':
        return 'success';
      case 'ANEXADO_AO_KIT':
        return 'info';
      case 'ENTREGUE_AO_SOBRINHO':
        return 'success';
      case 'PERDIDO':
      case 'CANCELADO':
        return 'danger';
      case 'SUBSTITUIDO':
        return 'warn';
      default:
        return 'info';
    }
  }

  iconeHistoricoCaderno(status: StatusCadernoChoro): string {
    switch (status) {
      case 'PENDENTE':
        return 'fa-solid fa-clock';
      case 'ENTREGUE_A_DUPLA':
        return 'fa-solid fa-hand-holding-heart';
      case 'RECEBIDO_DA_DUPLA':
        return 'fa-solid fa-people-carry-box';
      case 'CONFERIDO':
        return 'fa-solid fa-clipboard-check';
      case 'ANEXADO_AO_KIT':
        return 'fa-solid fa-box';
      case 'ENTREGUE_AO_SOBRINHO':
        return 'fa-solid fa-gift';
      case 'PERDIDO':
        return 'fa-solid fa-triangle-exclamation';
      case 'SUBSTITUIDO':
        return 'fa-solid fa-arrows-rotate';
      case 'CANCELADO':
        return 'fa-solid fa-ban';
      default:
        return 'fa-solid fa-circle';
    }
  }

  detalhamentoHistoricoCaderno(item: CadernoChoroHistorico): string {
    if (item.observacao?.trim()) {
      return item.observacao.trim();
    }

    switch (item.status) {
      case 'PENDENTE':
        return 'Caderno de mensagens gerado automaticamente a partir do vínculo ativo com a dupla.';
      case 'ENTREGUE_A_DUPLA':
        return 'Caderno de mensagens entregue à dupla responsável pelo encontrista.';
      case 'RECEBIDO_DA_DUPLA':
        return 'Caderno de mensagens recebido de volta pela equipe organizadora.';
      case 'CONFERIDO':
        return 'Equipe conferiu o conteúdo recebido antes da montagem do kit.';
      case 'ANEXADO_AO_KIT':
        return 'Caderno de mensagens anexado ao kit de encerramento do encontrista.';
      case 'ENTREGUE_AO_SOBRINHO':
        return 'Kit final entregue ao encontrista no encerramento.';
      case 'PERDIDO':
        return 'Registro de perda do caderno de mensagens.';
      case 'SUBSTITUIDO':
        return 'Registro de substituição do caderno de mensagens.';
      case 'CANCELADO':
        return 'Registro de cancelamento do caderno de mensagens.';
      default:
        return 'Movimentação registrada no histórico do caderno de mensagens.';
    }
  }

  registrarOperacaoPorCodigo(): void {
    if (this.codigoForm.invalid) {
      this.codigoForm.markAllAsTouched();
      this.toastWarn('Informe o código da credencial para registrar a operação.');
      return;
    }

    const valor = this.codigoForm.getRawValue();
    const codigo = this.normalizarCodigoCredencial(valor.codigoIdentificacao);
    this.codigoForm.controls.codigoIdentificacao.setValue(codigo, { emitEvent: false });

    this.processandoCodigo.set(true);

    const requisicao =
      valor.tipoOperacao === 'CHECKIN'
        ? this.service.registrarCheckinPorCodigo(this.eventoId, codigo)
        : this.service.registrarCheckoutPorCodigo(this.eventoId, codigo);

    requisicao
      .pipe(finalize(() => this.processandoCodigo.set(false)))
      .subscribe({
        next: tioAtualizado => {
          this.atualizarTioCaronaNaLista(tioAtualizado);

          this.limparFormularioCodigoTio(valor.tipoOperacao);

          this.toastSuccess(
            valor.tipoOperacao === 'CHECKIN'
              ? `Check-in registrado para ${tioAtualizado.pessoaNome}.`
              : `Checkout registrado para ${tioAtualizado.pessoaNome}.`
          );
        },
        error: erro => {
          console.error('Erro ao registrar operação por código', erro);
          this.toastError(this.mensagemErro(erro, 'Não foi possível registrar a operação por código.'));
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

  private atualizarCadernoNaLista(cadernoAtualizado: CadernoChoro): void {
    this.cadernos.update(cadernos =>
      cadernos.map(caderno =>
        caderno.id === cadernoAtualizado.id ? cadernoAtualizado : caderno
      )
    );
  }

  private atualizarCadernosNaLista(cadernosAtualizados: CadernoChoro[]): void {
    const idsAtualizados = new Set(cadernosAtualizados.map(caderno => caderno.id));

    this.cadernos.update(cadernos =>
      cadernos.map(caderno => {
        if (!idsAtualizados.has(caderno.id)) {
          return caderno;
        }

        return cadernosAtualizados.find(item => item.id === caderno.id) || caderno;
      })
    );
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
        console.error('Erro ao registrar presença do encontrista', erro);
        this.toastError(this.mensagemErro(erro, 'Não foi possível registrar a presença do encontrista.'));
      },
      complete: () => {
        this.processandoPresencaSobrinho.set(null);
      }
    });
  }

  registrarPresencaSobrinhoPorCodigo(): void {
    if (this.codigoSobrinhoForm.invalid) {
      this.codigoSobrinhoForm.markAllAsTouched();
      this.toastWarn('Informe o código da credencial do sobrinho.');
      return;
    }

    const valor = this.codigoSobrinhoForm.getRawValue();
    const codigo = this.normalizarCodigoCredencial(valor.codigoIdentificacao);
    this.codigoSobrinhoForm.controls.codigoIdentificacao.setValue(codigo, { emitEvent: false });

    this.processandoCodigoSobrinho.set(true);

    this.service.registrarPresencaSobrinhoPorCodigo(
      this.eventoId,
      codigo,
      valor.operacao,
      'Leitura via QR Code'
    )
      .pipe(finalize(() => this.processandoCodigoSobrinho.set(false)))
      .subscribe({
        next: sobrinhoAtualizado => {
          this.atualizarSobrinhoNaLista(sobrinhoAtualizado);

          this.limparFormularioCodigoSobrinho(valor.operacao);

          this.toastSuccess(
            `${sobrinhoAtualizado.nome} marcado como ${this.labelSobrinhoStatus(this.statusPresencaSobrinho(sobrinhoAtualizado)).toLowerCase()}.`
          );
        },
        error: erro => {
          console.error('Erro ao registrar presença por código', erro);
          this.toastError(this.mensagemErro(erro, 'Não foi possível registrar a presença pela credencial.'));
        }
      });
  }

  aoPressionarEnterCodigoSobrinho(event: Event): void {
    event.preventDefault();
    this.registrarPresencaSobrinhoPorCodigo();
  }

  labelOperacao(): string {
    return this.operacaoPronta() ? 'Pronta para operação' : 'Preparação incompleta';
  }

  severityOperacao(): 'success' | 'warn' {
    return this.operacaoPronta() ? 'success' : 'warn';
  }

  labelStatusCaderno(status: StatusCadernoChoro): string {
    switch (status) {
      case 'PENDENTE':
        return 'Pendente';
      case 'ENTREGUE_A_DUPLA':
        return 'Entregue à dupla';
      case 'RECEBIDO_DA_DUPLA':
        return 'Recebido da dupla';
      case 'DIRECIONADO_EQUIPE_MONTAGEM':
        return 'Direcionado ao kit';
      case 'CONFERIDO':
        return 'Conferido';
      case 'ANEXADO_AO_KIT':
        return 'Anexado ao kit';
      case 'ENTREGUE_AO_SOBRINHO':
        return 'Entregue ao encontrista';
      case 'PERDIDO':
        return 'Perdido';
      case 'SUBSTITUIDO':
        return 'Substituído';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return status;
    }
  }

  severityStatusCaderno(status: StatusCadernoChoro): 'info' | 'success' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'PENDENTE':
        return 'warn';
      case 'ENTREGUE_A_DUPLA':
        return 'info';
      case 'RECEBIDO_DA_DUPLA':
        return 'info';
      case 'DIRECIONADO_EQUIPE_MONTAGEM':
        return 'info';
      case 'CONFERIDO':
        return 'success';
      case 'ANEXADO_AO_KIT':
        return 'success';
      case 'ENTREGUE_AO_SOBRINHO':
        return 'success';
      case 'PERDIDO':
        return 'danger';
      case 'SUBSTITUIDO':
        return 'warn';
      case 'CANCELADO':
        return 'secondary';
      default:
        return 'secondary';
    }
  }


  corEquipeCaderno(caderno: CadernoChoro | ResumoEquipeCaderno): string {
    if (this.ehResumoEquipeCaderno(caderno)) {
      return this.normalizarCorHex(caderno.cor);
    }

    return this.normalizarCorHex(caderno.equipeMontagemKitCorIdentificacao);
  }

  private ehResumoEquipeCaderno(caderno: CadernoChoro | ResumoEquipeCaderno): caderno is ResumoEquipeCaderno {
    return 'cor' in caderno;
  }


  corEquipeCadernoFundo(caderno: CadernoChoro | ResumoEquipeCaderno): string {
    return this.hexParaRgba(this.corEquipeCaderno(caderno), 0.1);
  }

  corEquipeCadernoBorda(caderno: CadernoChoro | ResumoEquipeCaderno): string {
    return this.hexParaRgba(this.corEquipeCaderno(caderno), 0.32);
  }

  textoAcaoPrincipalCaderno(caderno: CadernoChoro): string {
    if (this.podeConferirCaderno(caderno)) {
      return 'Conferir';
    }

    if (this.podeAnexarCadernoAoKit(caderno)) {
      return 'Anexar ao kit';
    }

    if (this.podeEntregarCadernoAoSobrinho(caderno)) {
      return 'Entregar';
    }

    return 'Sem ação';
  }

  private statusCadernoAgrupa(statusAtual: StatusCadernoChoro, statusFiltro: StatusCadernoChoro): boolean {
    if (statusFiltro === 'PERDIDO') {
      return ['PERDIDO', 'SUBSTITUIDO'].includes(statusAtual);
    }

    return statusAtual === statusFiltro;
  }

  private normalizarCorHex(cor?: string): string {
    if (!cor || !/^#[0-9a-fA-F]{6}$/.test(cor.trim())) {
      return '#64748b';
    }

    return cor.trim();
  }

  private hexParaRgba(hex: string, alpha: number): string {
    const normalizado = this.normalizarCorHex(hex).replace('#', '');
    const r = parseInt(normalizado.substring(0, 2), 16);
    const g = parseInt(normalizado.substring(2, 4), 16);
    const b = parseInt(normalizado.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  podeConferirCaderno(caderno: CadernoChoro): boolean {
    return caderno.status === 'RECEBIDO_DA_DUPLA' || caderno.status === 'DIRECIONADO_EQUIPE_MONTAGEM';
  }

  podeAnexarCadernoAoKit(caderno: CadernoChoro): boolean {
    return caderno.status === 'CONFERIDO';
  }

  podeEntregarCadernoAoSobrinho(caderno: CadernoChoro): boolean {
    return caderno.status === 'ANEXADO_AO_KIT';
  }

  podeMarcarCadernoPerdido(caderno: CadernoChoro): boolean {
    return !['ENTREGUE_AO_SOBRINHO', 'CANCELADO'].includes(caderno.status);
  }

  podeMarcarCadernoSubstituido(caderno: CadernoChoro): boolean {
    return !['ENTREGUE_AO_SOBRINHO', 'CANCELADO'].includes(caderno.status);
  }

  podeCancelarCaderno(caderno: CadernoChoro): boolean {
    return caderno.status !== 'ENTREGUE_AO_SOBRINHO' && caderno.status !== 'CANCELADO';
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

  credencialPermiteOperacao(tio: TioCaronaEvento): boolean {
    /*
     * Compatibilidade: quando o backend ainda não envia credencialStatus,
     * mantemos o tio na operação. Quando envia, somente credencial ATIVA
     * deve contar como operacional.
     */
    if (!tio.credencialStatus) {
      return true;
    }

    return tio.credencialStatus === 'ATIVA';
  }

  labelCredencialOperacionalTio(tio: TioCaronaEvento): string {
    switch (tio.credencialStatus) {
      case 'ATIVA':
        return 'Credencial ativa';
      case 'INATIVA':
        return 'Credencial inativa';
      case 'CANCELADA':
        return 'Credencial cancelada';
      default:
        return 'Credencial não gerada';
    }
  }

  severityCredencialOperacionalTio(tio: TioCaronaEvento): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (tio.credencialStatus) {
      case 'ATIVA':
        return 'success';
      case 'INATIVA':
        return 'warn';
      case 'CANCELADA':
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
    return this.credencialPermiteOperacao(tio) && tio.statusOperacional !== 'COM_CHECKIN';
  }

  podeCheckoutManual(tio: TioCaronaEvento): boolean {
    return this.credencialPermiteOperacao(tio) && tio.statusOperacional === 'COM_CHECKIN';
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
        this.toastError('Não foi possível carregar os encontristas.');
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
      const corpo = (erro as {
        error?: {
          message?: string;
          detail?: string;
          title?: string;
          details?: string[];
        };
      }).error;

      if (corpo?.details?.length) {
        return corpo.details.join(' ');
      }

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

  private normalizarCodigoCredencial(valor: string | null | undefined): string {
    return String(valor ?? '')
      .trim()
      .replace(/\s+/g, '')
      .toUpperCase();
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

  private limparFormularioCodigoTio(tipoOperacao: 'CHECKIN' | 'CHECKOUT'): void {
    this.codigoForm.reset({
      codigoIdentificacao: '',
      tipoOperacao
    });

    this.codigoForm.markAsPristine();
    this.codigoForm.markAsUntouched();
    this.codigoForm.updateValueAndValidity();
  }

  private limparFormularioCodigoSobrinho(operacao: OperacaoPresencaSobrinho): void {
    this.codigoSobrinhoForm.reset({
      codigoIdentificacao: '',
      operacao
    });

    this.codigoSobrinhoForm.markAsPristine();
    this.codigoSobrinhoForm.markAsUntouched();
    this.codigoSobrinhoForm.updateValueAndValidity();
  }
}

