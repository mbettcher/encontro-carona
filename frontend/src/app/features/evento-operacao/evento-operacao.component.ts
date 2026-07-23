import { DatePipe, NgClass } from '@angular/common';
import { finalize } from 'rxjs';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  ConfirmationService,
  MessageService
} from 'primeng/api';
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
import { CheckboxModule } from 'primeng/checkbox';

import {
  CadernoChoro,
  CadernoChoroCancelarRequest,
  CadernoChoroHistorico,
  CadernoChoroOcorrenciaRequest,
  CadernoChoroRecuperarRequest,
  CadernoChoroSubstituirRequest,
  CadernoChoroTimeline,
  CredencialEvento,
  DuplaTioCarona,
  Evento,
  ModeloCarteirinhaCredencial,
  ModeloCrachaCredencial,
  ModeloEtiquetaQr,
  MotivoCancelamentoCaderno,
  MotivoEmissaoCaderno,
  MotivoSubstituicaoCaderno,
  OperacaoPresencaSobrinho,
  Sobrinho,
  SobrinhoDupla,
  StatusCadernoChoro,
  StatusCredencial,
  TioCaronaEvento,
  TipoCredencial,
  TipoMovimentacaoCaderno,
  TipoOcorrenciaCaderno
} from '../../shared/models';
import { AuthService } from '../../core/auth/auth.service';
import { EventoOperacaoService } from './evento-operacao.service';
import { QrScannerComponent } from '../../shared/qr-scanner/qr-scanner.component';
import { QrCodeLeitura } from '../../shared/qr-scanner/qr-scanner.models';

type TipoOperacaoScannerTio = 'CHECKIN' | 'CHECKOUT';

type StatusResultadoScannerTio =
  | 'SUCESSO'
  | 'ATENCAO'
  | 'ERRO';

interface ResultadoScannerTio {
  status: StatusResultadoScannerTio;
  operacao: TipoOperacaoScannerTio;
  mensagem: string;
  pessoaNome?: string;
  ocorridoEm: Date;
}

interface ResultadoScannerEncontrista {
  status: StatusResultadoScannerTio;
  operacao: OperacaoPresencaSobrinho;
  mensagem: string;
  pessoaNome?: string;
  ocorridoEm: Date;
}

type OperacaoCadernoChoro =
  | 'CONFERIDO'
  | 'ANEXADO_AO_KIT'
  | 'ENTREGUE_AO_SOBRINHO';

type TipoListaPresenca = 'ENCONTRISTAS' | 'TIOS_CARONA';
type TipoRelatorioOperacao = 'ENCONTRISTAS' | 'TIOS_CARONA' | 'CADERNOS';
type TipoImpressaoOperacao = 'ETIQUETAS_QR' | 'CRACHAS' | 'CARTEIRINHAS' | 'LISTA_ENCONTRISTAS' | 'LISTA_TIOS_CARONA';

type AbaOperacao =
  | 'VISAO_GERAL'
  | 'LEITURAS_QR'
  | 'TIOS_CARONA'
  | 'SOBRINHOS'
  | 'CADERNO_CHORO'
  | 'RELATORIOS'
  | 'IMPRESSOES';

type TipoOperacaoLoteCaderno =
  | 'ENTREGA'
  | 'RECEBIMENTO'
  | 'RECOLHIMENTO';

type AcaoEspecialCaderno =
  | 'PERDA'
  | 'DANO'
  | 'RECUPERAR'
  | 'SUBSTITUIR'
  | 'CANCELAR';

interface OpcaoStatusCaderno {
  label: string;
  value: StatusCadernoChoro;
}

interface OpcaoEquipeCaderno {
  label: string;
  value: number;
  cor?: string | null;
}

interface ResumoEquipeCaderno {
  id: number | null;
  apelido: string;
  cor?: string | null;
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
    NgClass,
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
    TabsModule,
    CheckboxModule,
    QrScannerComponent
  ],
  templateUrl: './evento-operacao.component.html',
  styleUrls: ['./evento-operacao.component.scss']
})
export class EventoOperacaoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly seguranca = inject(AuthService);

  private readonly service = inject(EventoOperacaoService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly eventoId = Number(this.route.snapshot.paramMap.get('eventoId'));

  readonly tiosCarona = signal<TioCaronaEvento[]>([]);
  readonly duplas = signal<DuplaTioCarona[]>([]);
  readonly sobrinhos = signal<Sobrinho[]>([]);
  readonly vinculos = signal<SobrinhoDupla[]>([]);
  readonly cadernos = signal<CadernoChoro[]>([]);
  readonly credenciais = signal<CredencialEvento[]>([]);
  readonly carregando = signal(false);
  readonly processandoCodigo = signal(false);
  readonly scannerTioVisivel = signal(false);
  readonly tipoOperacaoScannerTio =
    signal<TipoOperacaoScannerTio>('CHECKIN');
  readonly resultadoScannerTio =
    signal<ResultadoScannerTio | null>(null);
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
  readonly tipoRelatorioSelecionado = signal<TipoRelatorioOperacao>('ENCONTRISTAS');
  readonly duplaRelatorioSelecionada = signal<number | null>(null);
  readonly equipeRelatorioSelecionada = signal<number | null>(null);
  readonly statusCadernoRelatorioSelecionado = signal<StatusCadernoChoro | null>(null);
  readonly somenteAtivosRelatorio = signal(true);
  readonly tipoImpressaoSelecionado = signal<TipoImpressaoOperacao>('ETIQUETAS_QR');
  readonly modeloEtiquetaQrSelecionado = signal<ModeloEtiquetaQr>('PIMACO_A4356_63X25_33');
  readonly modeloCrachaSelecionado = signal<ModeloCrachaCredencial>('A4_2_COLUNAS_4');
  readonly modeloCarteirinhaSelecionado = signal<ModeloCarteirinhaCredencial>('A4_10_CARTEIRINHAS');
  readonly tipoCredencialImpressaoSelecionado = signal<TipoCredencial | null>(null);
  readonly statusCredencialImpressaoSelecionado = signal<StatusCredencial | null>('ATIVA');
  readonly filtroTextoImpressao = signal('');
  readonly baixandoImpressao = signal(false);
  readonly cadernoSelecionado = signal<CadernoChoro | null>(null);
  readonly timelineCaderno = signal<CadernoChoroTimeline | null>(null);
  readonly viaTimelineSelecionadaId = signal<number | null>(null);
  readonly historicoCadernoVisivel = signal(false);
  readonly carregandoHistoricoCaderno = signal(false);
  readonly operacaoCadernoVisivel = signal(false);
  readonly operacaoCadernoPendente = signal<OperacaoCadernoChoro | null>(null);
  readonly observacaoOperacaoCaderno = signal('');
  readonly acoesEspeciaisCadernoVisivel = signal(false);
  readonly acaoEspecialCadernoSelecionada =
    signal<AcaoEspecialCaderno | null>(null);
  readonly observacaoAcaoEspecialCaderno = signal('');
  readonly danoImpedeContinuacaoCaderno = signal(true);
  readonly motivoSubstituicaoCaderno =
    signal<MotivoSubstituicaoCaderno | null>(null);
  readonly motivoCancelamentoCaderno =
    signal<MotivoCancelamentoCaderno | null>(null);
  readonly processandoCodigoSobrinho = signal(false);
  readonly scannerEncontristaVisivel = signal(false);
  readonly operacaoScannerEncontrista =
    signal<OperacaoPresencaSobrinho>('PRESENTE');
  readonly resultadoScannerEncontrista =
    signal<ResultadoScannerEncontrista | null>(null);
  readonly abaOperacaoAtiva = signal<AbaOperacao>('VISAO_GERAL');
  readonly tipoOperacaoLoteCaderno =
    signal<TipoOperacaoLoteCaderno>('ENTREGA');

  readonly cadernosSelecionadosIds =
    signal<Set<number>>(new Set<number>());

  readonly operacaoLoteCadernoVisivel = signal(false);

  readonly tioOperacaoLoteCadernoId =
    signal<number | null>(null);

  readonly observacaoOperacaoLoteCaderno = signal('');

  readonly viasTimelineCaderno = computed(() => {
    const timeline = this.timelineCaderno();

    if (!timeline) {
      return [];
    }

    return [...timeline.vias]
      .sort((a, b) => b.numeroVia - a.numeroVia);
  });

  readonly viaAtualTimeline = computed(() => {
    const timeline = this.timelineCaderno();

    if (!timeline) {
      return null;
    }

    return timeline.vias.find(
      via => via.id === timeline.cadernoAtualId
    ) ?? timeline.vias.find(via => via.viaAtual) ?? null;
  });

  readonly viaTimelineSelecionada = computed(() => {
    const timeline = this.timelineCaderno();
    const viaId = this.viaTimelineSelecionadaId();

    if (!timeline || viaId === null) {
      return null;
    }

    return timeline.vias.find(
      via => via.id === viaId
    ) ?? null;
  });

  readonly movimentacoesTimelineCaderno = computed(() => {
    const timeline = this.timelineCaderno();

    if (!timeline) {
      return [];
    }

    const viaId = this.viaTimelineSelecionadaId();

    return [...timeline.movimentacoes]
      .filter(item =>
        viaId === null || item.cadernoId === viaId
      )
      .sort((a, b) =>
        new Date(a.ocorridoEm).getTime() -
        new Date(b.ocorridoEm).getTime()
      );
  });

  readonly totalViasTimelineCaderno = computed(
    () => this.timelineCaderno()?.vias.length ?? 0
  );

  readonly possuiMultiplasViasTimeline = computed(
    () => this.totalViasTimelineCaderno() > 1
  );

  readonly tituloScannerTio = computed(() =>
    this.tipoOperacaoScannerTio() === 'CHECKIN'
      ? 'Check-in de Tio Carona'
      : 'Check-out de Tio Carona'
  );

  readonly instrucaoScannerTio = computed(() =>
    this.tipoOperacaoScannerTio() === 'CHECKIN'
      ? 'Leia a credencial para registrar a entrada.'
      : 'Leia a credencial para registrar a saída.'
  );

  readonly codigoForm = this.fb.nonNullable.group({
    codigoIdentificacao: ['', [Validators.required, Validators.maxLength(80)]],
    tipoOperacao: ['CHECKIN' as 'CHECKIN' | 'CHECKOUT', [Validators.required]]
  });

  readonly tituloScannerEncontrista = computed(() => {
    switch (this.operacaoScannerEncontrista()) {
      case 'PRESENTE':
        return 'Registrar presença do Encontrista';
      case 'AUSENTE':
        return 'Registrar ausência do Encontrista';
      case 'DESISTENTE':
        return 'Registrar desistência do Encontrista';
    }
  });

  readonly instrucaoScannerEncontrista = computed(() => {
    switch (this.operacaoScannerEncontrista()) {
      case 'PRESENTE':
        return 'Leia a credencial para marcar o encontrista como presente.';
      case 'AUSENTE':
        return 'Leia a credencial para marcar o encontrista como ausente.';
      case 'DESISTENTE':
        return 'Leia a credencial para registrar a desistência.';
    }
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

  readonly sobrinhosDesistentes = computed(() =>
    this.sobrinhos().filter(sobrinho => this.statusPresencaSobrinho(sobrinho) === 'DESISTENTE')
  );

  readonly sobrinhosAtivos = computed(() =>
    this.sobrinhos().filter(sobrinho => this.statusPresencaSobrinho(sobrinho) !== 'DESISTENTE')
  );

  readonly sobrinhosInscritos = computed(() =>
    this.sobrinhosAtivos().filter(sobrinho => this.statusPresencaSobrinho(sobrinho) === 'INSCRITO')
  );

  readonly sobrinhosPresentes = computed(() =>
    this.sobrinhosAtivos().filter(sobrinho => this.statusPresencaSobrinho(sobrinho) === 'PRESENTE')
  );

  readonly sobrinhosAusentes = computed(() =>
    this.sobrinhosAtivos().filter(sobrinho => this.statusPresencaSobrinho(sobrinho) === 'AUSENTE')
  );

  readonly vinculosAtivos = computed(() => {
    const idsSobrinhosAtivos = new Set(this.sobrinhosAtivos().map(sobrinho => sobrinho.id));

    return this.vinculos()
      .filter(vinculo => vinculo.status === 'ATIVO')
      .filter(vinculo => idsSobrinhosAtivos.has(vinculo.sobrinhoId));
  });

  readonly percentualVinculados = computed(() => {
    const total = this.sobrinhosAtivos().length;

    if (total === 0) {
      return 0;
    }

    return Math.round((this.vinculosAtivos().length / total) * 100);
  });

  readonly percentualPresentes = computed(() => {
    const total = this.sobrinhosAtivos().length;

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

  readonly cadernosElegiveisOperacaoLote = computed(() =>
    this.cadernosFiltrados().filter(caderno =>
      this.cadernoElegivelParaOperacaoLote(caderno)
    )
  );

  readonly cadernosSelecionadosOperacaoLote = computed(() => {
    const ids = this.cadernosSelecionadosIds();

    return this.cadernos()
      .filter(caderno => ids.has(caderno.id))
      .sort((a, b) =>
        a.sobrinhoNome.localeCompare(
          b.sobrinhoNome,
          'pt-BR'
        )
      );
  });

  readonly quantidadeCadernosSelecionados = computed(
    () => this.cadernosSelecionadosIds().size
  );

  readonly duplaOperacaoLote = computed(() => {
    const selecionados =
      this.cadernosSelecionadosOperacaoLote();

    if (selecionados.length === 0) {
      return null;
    }

    const primeiraDuplaId = selecionados[0].duplaId;

    if (
      selecionados.some(
        caderno => caderno.duplaId !== primeiraDuplaId
      )
    ) {
      return null;
    }

    return this.duplas().find(
      dupla => dupla.id === primeiraDuplaId
    ) ?? null;
  });

  readonly tiosDaDuplaOperacaoLote = computed(() => {
    const dupla = this.duplaOperacaoLote();

    if (!dupla) {
      return [];
    }

    const tioIds = new Set([
      dupla.tio1Id,
      dupla.tio2Id
    ]);

    return this.tiosCarona()
      .filter(tio =>
        tioIds.has(tio.id) &&
        tio.status === 'ATIVO'
      )
      .map(tio => ({
        label: tio.pessoaNome,
        value: tio.id
      }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, 'pt-BR')
      );
  });

  readonly todosCadernosVisiveisSelecionados =
    computed(() => {
      const elegiveis =
        this.cadernosElegiveisOperacaoLote();

      if (elegiveis.length === 0) {
        return false;
      }

      const selecionados =
        this.cadernosSelecionadosIds();

      return elegiveis.every(caderno =>
        selecionados.has(caderno.id)
      );
    });

  readonly possuiSelecaoParcialCadernos =
    computed(() => {
      const elegiveis =
        this.cadernosElegiveisOperacaoLote();

      if (elegiveis.length === 0) {
        return false;
      }

      const quantidadeSelecionada =
        elegiveis.filter(caderno =>
          this.cadernosSelecionadosIds().has(
            caderno.id
          )
        ).length;

      return quantidadeSelecionada > 0 &&
        quantidadeSelecionada < elegiveis.length;
    });

  readonly podeAbrirOperacaoLoteCaderno =
    computed(() => {
      const selecionados =
        this.cadernosSelecionadosOperacaoLote();

      if (
        !this.seguranca.podeEscrever() ||
        selecionados.length === 0 ||
        this.processandoCadernos()
      ) {
        return false;
      }

      const duplaId = selecionados[0].duplaId;

      return selecionados.every(caderno =>
        caderno.duplaId === duplaId &&
        this.cadernoElegivelParaOperacaoLote(caderno)
      );
    });

  readonly podeConfirmarOperacaoLoteCaderno =
    computed(() =>
      this.podeAbrirOperacaoLoteCaderno() &&
      this.tioOperacaoLoteCadernoId() !== null
    );


  readonly opcoesTiposRelatorio = [
    {
      label: 'Encontristas',
      value: 'ENCONTRISTAS' as TipoRelatorioOperacao,
      descricao: 'Lista oficial de presença dos encontristas'
    },
    {
      label: 'Tios carona',
      value: 'TIOS_CARONA' as TipoRelatorioOperacao,
      descricao: 'Lista oficial de presença dos tios carona'
    },
    {
      label: 'Caderno de Mensagens',
      value: 'CADERNOS' as TipoRelatorioOperacao,
      descricao: 'Relatório dos cadernos por equipe, dupla e status'
    }
  ];

  readonly opcoesDuplasRelatorio = computed(() => [
    { label: 'Todas as duplas', value: null as number | null },
    ...this.opcoesDuplasCaderno()
  ]);

  readonly opcoesEquipesRelatorio = computed(() => [
    { label: 'Todas as equipes', value: null as number | null },
    ...this.opcoesEquipesCaderno()
  ]);

  readonly opcoesStatusCadernoRelatorio = computed(() => [
    { label: 'Todos os status', value: null as StatusCadernoChoro | null },
    ...this.opcoesStatusCaderno
  ]);

  readonly opcoesTiposImpressao = [
    {
      label: 'Etiquetas QR Code',
      value: 'ETIQUETAS_QR' as TipoImpressaoOperacao,
      descricao: 'Etiquetas oficiais com QR Code das credenciais'
    },
    {
      label: 'Crachás / Credenciais',
      value: 'CRACHAS' as TipoImpressaoOperacao,
      descricao: 'Crachás oficiais com QR Code e identificação visual'
    },
    {
      label: 'Carteirinhas operacionais',
      value: 'CARTEIRINHAS' as TipoImpressaoOperacao,
      descricao: 'Credenciais em formato horizontal tipo cartão'
    },
    {
      label: 'Lista de presença — Encontristas',
      value: 'LISTA_ENCONTRISTAS' as TipoImpressaoOperacao,
      descricao: 'Lista oficial de presença dos encontristas'
    },
    {
      label: 'Lista de presença — Tios carona',
      value: 'LISTA_TIOS_CARONA' as TipoImpressaoOperacao,
      descricao: 'Lista oficial dos tios carona organizada por duplas'
    }
  ];

  readonly opcoesModelosEtiquetaQr = [
    {
      label: 'Pimaco A4348 - 31,0 x 17,0 mm / 96 etiquetas',
      value: 'PIMACO_A4348_31X17_96' as ModeloEtiquetaQr,
      descricao: 'Folha A4 compacta para grande volume de QR Codes'
    },
    {
      label: 'Pimaco A4356 - 63,5 x 25,4 mm / 33 etiquetas',
      value: 'PIMACO_A4356_63X25_33' as ModeloEtiquetaQr,
      descricao: 'Folha A4 intermediária com QR e identificação'
    },
    {
      label: 'Pimaco A4362 - 99,0 x 33,9 mm / 16 etiquetas',
      value: 'PIMACO_A4362_99X34_16' as ModeloEtiquetaQr,
      descricao: 'Folha A4 maior, mais confortável para leitura'
    },
    {
      label: 'Pimaco A4355 - 63,5 x 46,6 mm / 18 etiquetas',
      value: 'PIMACO_A4355_63X47_18' as ModeloEtiquetaQr,
      descricao: 'Folha A4 alta, com visual premium tipo minicrachá'
    },
    {
      label: 'A4 - 3 colunas / 24 etiquetas',
      value: 'A4_3_COLUNAS_24' as ModeloEtiquetaQr,
      descricao: 'Modelo genérico para folha A4 com etiquetas menores'
    },
    {
      label: 'A4 - 2 colunas / 14 etiquetas',
      value: 'A4_2_COLUNAS_14' as ModeloEtiquetaQr,
      descricao: 'Modelo genérico para folha A4 com etiquetas maiores'
    },
    {
      label: 'Etiqueta 70 x 37 mm',
      value: 'ETIQUETA_70X37' as ModeloEtiquetaQr,
      descricao: 'Modelo unitário para etiqueta comercial maior'
    },
    {
      label: 'Etiqueta 50 x 30 mm',
      value: 'ETIQUETA_50X30' as ModeloEtiquetaQr,
      descricao: 'Modelo unitário compacto'
    }
  ];

  readonly opcoesModelosCracha = [
    {
      label: 'A4 - 2 colunas / 4 crachás',
      value: 'A4_2_COLUNAS_4' as ModeloCrachaCredencial,
      descricao: 'Boa opção para impressão em folha A4 com corte manual'
    },
    {
      label: 'A4 - 1 coluna / 2 crachás grandes',
      value: 'A4_1_COLUNA_2' as ModeloCrachaCredencial,
      descricao: 'Crachá maior, visual mais premium'
    },
    {
      label: 'Crachá unitário 90 x 130 mm',
      value: 'CRACHA_90X130' as ModeloCrachaCredencial,
      descricao: 'Modelo unitário para impressão individual'
    }
  ];

  readonly opcoesModelosCarteirinha = [
    {
      label: 'A4 - 10 carteirinhas',
      value: 'A4_10_CARTEIRINHAS' as ModeloCarteirinhaCredencial,
      descricao: 'Modelo horizontal em folha A4 para corte manual'
    },
    {
      label: 'Carteirinha unitária CR80 - 86 x 54 mm',
      value: 'CARTEIRINHA_CR80_86X54' as ModeloCarteirinhaCredencial,
      descricao: 'Modelo unitário em tamanho padrão de cartão'
    }
  ];

  readonly opcoesTiposCredencialImpressao = [
    { label: 'Todos', value: null as TipoCredencial | null },
    { label: 'Encontristas', value: 'SOBRINHO' as TipoCredencial },
    { label: 'Tios carona', value: 'TIO_CARONA' as TipoCredencial }
  ];

  readonly opcoesStatusCredencialImpressao = [
    { label: 'Ativas', value: 'ATIVA' as StatusCredencial | null },
    { label: 'Todas', value: null as StatusCredencial | null },
    { label: 'Inativas', value: 'INATIVA' as StatusCredencial },
    { label: 'Canceladas', value: 'CANCELADA' as StatusCredencial }
  ];

  readonly credenciaisImpressaoFiltradas = computed(() => {
    const tipo = this.tipoCredencialImpressaoSelecionado();
    const status = this.statusCredencialImpressaoSelecionado();
    const filtro = this.normalizarFiltro(this.filtroTextoImpressao());

    return this.credenciais()
      .filter(credencial => !tipo || credencial.tipo === tipo)
      .filter(credencial => !status || credencial.status === status)
      .filter(credencial => {
        if (!filtro) {
          return true;
        }

        return this.contemFiltro(credencial.codigo, filtro) ||
          this.contemFiltro(credencial.pessoaNome, filtro) ||
          this.contemFiltro(credencial.sobrinhoNome, filtro) ||
          this.contemFiltro(credencial.responsavelNome, filtro) ||
          this.contemFiltro(credencial.duplaCodigo, filtro) ||
          this.contemFiltro(credencial.duplaApelido, filtro) ||
          this.contemFiltro(credencial.tipo, filtro) ||
          this.contemFiltro(credencial.status, filtro);
      });
  });

  readonly totalPrevistoImpressao = computed(() => {
    const tipo = this.tipoImpressaoSelecionado();

    if (tipo === 'LISTA_ENCONTRISTAS') {
      return this.vinculosAtivos().length;
    }

    if (tipo === 'LISTA_TIOS_CARONA') {
      return this.duplasAtivas().length;
    }

    return this.credenciaisImpressaoFiltradas().length;
  });

  readonly tipoImpressaoAtual = computed(() =>
    this.opcoesTiposImpressao.find(opcao => opcao.value === this.tipoImpressaoSelecionado())
  );

  readonly modeloImpressaoAtual = computed(() => {
    const tipo = this.tipoImpressaoSelecionado();

    if (tipo === 'CRACHAS') {
      return this.opcoesModelosCracha.find(opcao => opcao.value === this.modeloCrachaSelecionado());
    }

    if (tipo === 'CARTEIRINHAS') {
      return this.opcoesModelosCarteirinha.find(opcao => opcao.value === this.modeloCarteirinhaSelecionado());
    }

    if (tipo === 'LISTA_ENCONTRISTAS' || tipo === 'LISTA_TIOS_CARONA') {
      return this.tipoImpressaoAtual();
    }

    return this.opcoesModelosEtiquetaQr.find(opcao => opcao.value === this.modeloEtiquetaQrSelecionado());
  });

  readonly tituloTotalImpressao = computed(() => {
    switch (this.tipoImpressaoSelecionado()) {
      case 'CRACHAS':
        return 'Crachás previstos';
      case 'CARTEIRINHAS':
        return 'Carteirinhas previstas';
      case 'LISTA_ENCONTRISTAS':
        return 'Encontristas previstos';
      case 'LISTA_TIOS_CARONA':
        return 'Duplas previstas';
      default:
        return 'Etiquetas previstas';
    }
  });

  readonly saidaImpressao = computed(() => {
    switch (this.tipoImpressaoSelecionado()) {
      case 'CRACHAS':
        return 'PDF com crachás';
      case 'CARTEIRINHAS':
        return 'PDF com carteirinhas';
      case 'LISTA_ENCONTRISTAS':
        return 'PDF da lista de encontristas';
      case 'LISTA_TIOS_CARONA':
        return 'PDF da lista de tios por dupla';
      default:
        return 'PDF com QR Code';
    }
  });

  readonly filtroPublicoImpressao = computed(() => {
    if (this.tipoImpressaoSelecionado() === 'LISTA_ENCONTRISTAS') {
      return 'Encontristas ativos';
    }

    if (this.tipoImpressaoSelecionado() === 'LISTA_TIOS_CARONA') {
      return 'Duplas ativas';
    }

    const tipo = this.tipoCredencialImpressaoSelecionado();

    if (tipo === 'SOBRINHO') {
      return 'Encontristas';
    }

    if (tipo === 'TIO_CARONA') {
      return 'Tios carona';
    }

    return 'Todos os públicos';
  });

  readonly filtroStatusImpressao = computed(() => {
    if (this.tipoImpressaoSelecionado() === 'LISTA_ENCONTRISTAS' || this.tipoImpressaoSelecionado() === 'LISTA_TIOS_CARONA') {
      return 'Somente ativos';
    }

    const status = this.statusCredencialImpressaoSelecionado();

    if (status === 'ATIVA') {
      return 'Credenciais ativas';
    }

    if (status === 'INATIVA') {
      return 'Credenciais inativas';
    }

    if (status === 'CANCELADA') {
      return 'Credenciais canceladas';
    }

    return 'Todos os status';
  });

  readonly resumoCredenciaisImpressao = computed(() => {
    const credenciais = this.credenciaisImpressaoFiltradas();

    return {
      ativas: credenciais.filter(credencial => credencial.status === 'ATIVA').length,
      inativas: credenciais.filter(credencial => credencial.status === 'INATIVA').length,
      canceladas: credenciais.filter(credencial => credencial.status === 'CANCELADA').length
    };
  });

  readonly podeEmitirImpressao = computed(() => this.totalPrevistoImpressao() > 0 && !this.baixandoImpressao());

  readonly totalPrevistoRelatorio = computed(() => {
    const tipo = this.tipoRelatorioSelecionado();
    const duplaId = this.duplaRelatorioSelecionada();

    if (tipo === 'ENCONTRISTAS') {
      return this.vinculosAtivos()
        .filter(vinculo => !duplaId || vinculo.duplaId === duplaId)
        .length;
    }

    if (tipo === 'TIOS_CARONA') {
      if (!duplaId) {
        return this.tiosAtivos().length;
      }

      const dupla = this.duplasAtivas().find(item => item.id === duplaId);

      if (!dupla) {
        return 0;
      }

      const ids = new Set([dupla.tio1Id, dupla.tio2Id]);
      return this.tiosAtivos().filter(tio => ids.has(tio.id)).length;
    }

    const equipeId = this.equipeRelatorioSelecionada();
    const statusSelecionado = this.statusCadernoRelatorioSelecionado();

    return this.cadernos()
      .filter(caderno => !duplaId || caderno.duplaId === duplaId)
      .filter(caderno => !equipeId || caderno.equipeMontagemKitId === equipeId)
      .filter(caderno => !statusSelecionado || this.statusCadernoAgrupa(caderno.status, statusSelecionado))
      .length;
  });

  readonly podeEmitirRelatorioOperacao = computed(() => this.totalPrevistoRelatorio() > 0 && !this.baixandoRelatorioOperacao());

  readonly baixandoRelatorioOperacao = computed(() =>
    this.baixandoListaPresenca() !== null || this.baixandoRelatorioCadernos()
  );

  readonly opcoesEquipesCaderno =
    computed<OpcaoEquipeCaderno[]>(() => {
      const equipes =
        new Map<number, OpcaoEquipeCaderno>();

      this.cadernos()
        .filter(
          caderno =>
            caderno.equipeMontagemKitId != null
        )
        .forEach(caderno => {
          const id = caderno.equipeMontagemKitId;

          if (id == null || equipes.has(id)) {
            return;
          }

          const opcao: OpcaoEquipeCaderno = {
            value: id,
            label:
              caderno.equipeMontagemKitApelido?.trim() ||
              `Equipe ${id}`,
            cor:
              caderno.equipeMontagemKitCorIdentificacao ??
              null
          };

          equipes.set(id, opcao);
        });

      return Array.from(equipes.values())
        .sort((a, b) =>
          a.label.localeCompare(b.label, 'pt-BR')
        );
    });

  readonly opcoesMotivoCancelamentoCaderno = [
    {
      label: 'Não participou do evento',
      value: 'NAO_PARTICIPOU_DO_EVENTO' as MotivoCancelamentoCaderno
    },
    {
      label: 'Erro de cadastro',
      value: 'ERRO_DE_CADASTRO' as MotivoCancelamentoCaderno
    },
    {
      label: 'Caderno não necessário',
      value: 'CADERNO_NAO_NECESSARIO' as MotivoCancelamentoCaderno
    },
    {
      label: 'Desistência do encontrista',
      value: 'DESISTENCIA_ENCONTRISTA' as MotivoCancelamentoCaderno
    },
    {
      label: 'Outro motivo',
      value: 'OUTRO' as MotivoCancelamentoCaderno
    }
  ];

  readonly opcoesMotivoSubstituicaoCaderno = [
    { label: 'Perda', value: 'PERDA' as MotivoSubstituicaoCaderno },
    { label: 'Dano', value: 'DANO' as MotivoSubstituicaoCaderno },
    { label: 'Erro de impressão', value: 'ERRO_DE_IMPRESSAO' as MotivoSubstituicaoCaderno },
    { label: 'Erro de montagem', value: 'ERRO_DE_MONTAGEM' as MotivoSubstituicaoCaderno },
    { label: 'Conteúdo inutilizado', value: 'CONTEUDO_INUTILIZADO' as MotivoSubstituicaoCaderno },
    { label: 'Outro motivo', value: 'OUTRO' as MotivoSubstituicaoCaderno }
  ];

  readonly opcoesStatusCaderno: OpcaoStatusCaderno[] = [
    { label: 'Pendente', value: 'PENDENTE' },
    { label: 'Com a dupla', value: 'ENTREGUE_A_DUPLA' },
    { label: 'Direcionado à equipe', value: 'DIRECIONADO_EQUIPE_MONTAGEM' },
    { label: 'Conferido', value: 'CONFERIDO' },
    { label: 'Anexado ao kit', value: 'ANEXADO_AO_KIT' },
    { label: 'Entregue ao encontrista', value: 'ENTREGUE_AO_SOBRINHO' },
    { label: 'Ocorrências', value: 'PERDIDO' },
    { label: 'Cancelado', value: 'CANCELADO' },
    { label: 'Danificado', value: 'DANIFICADO' },
  ];

  readonly resumoEquipesCaderno =
    computed<ResumoEquipeCaderno[]>(() => {
      const resumo =
        new Map<number | null, ResumoEquipeCaderno>();

      const statusComEquipe: StatusCadernoChoro[] = [
        'DIRECIONADO_EQUIPE_MONTAGEM',
        'CONFERIDO',
        'ANEXADO_AO_KIT',
        'ENTREGUE_AO_SOBRINHO'
      ];

      this.cadernos()
        .filter(caderno =>
          statusComEquipe.includes(caderno.status)
        )
        .forEach(caderno => {
          const chave =
            caderno.equipeMontagemKitId ?? null;

          const itemExistente = resumo.get(chave);

          const item: ResumoEquipeCaderno =
            itemExistente ?? {
              id: chave,
              apelido:
                caderno.equipeMontagemKitApelido?.trim() ||
                'Sem equipe',
              cor:
                caderno
                  .equipeMontagemKitCorIdentificacao ??
                null,
              total: 0,
              direcionados: 0,
              conferidos: 0,
              noKit: 0,
              entregues: 0
            };

          item.total++;

          switch (caderno.status) {
            case 'DIRECIONADO_EQUIPE_MONTAGEM':
              item.direcionados++;
              break;

            case 'CONFERIDO':
              item.conferidos++;
              break;

            case 'ANEXADO_AO_KIT':
              item.noKit++;
              break;

            case 'ENTREGUE_AO_SOBRINHO':
              item.entregues++;
              break;
          }

          resumo.set(chave, item);
        });

      return Array.from(resumo.values())
        .sort((a, b) =>
          a.apelido.localeCompare(
            b.apelido,
            'pt-BR'
          )
        );
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
    this.aplicarAbaInicialDaRota();
    this.carregarDados();
  }

  private aplicarAbaInicialDaRota(): void {
    const aba = this.route.snapshot.queryParamMap.get('aba') as AbaOperacao | null;
    const abasValidas: AbaOperacao[] = [
      'VISAO_GERAL',
      'LEITURAS_QR',
      'TIOS_CARONA',
      'SOBRINHOS',
      'CADERNO_CHORO',
      'RELATORIOS',
      'IMPRESSOES'
    ];

    if (aba && abasValidas.includes(aba)) {
      this.abaOperacaoAtiva.set(aba);
    }
  }

  carregarDados(): void {
    this.carregando.set(true);

    this.carregarEvento();
    this.carregarTios();
    this.carregarDuplas();
    this.carregarSobrinhos();
    this.carregarVinculos();
    this.carregarCadernos();
    this.carregarCredenciais();

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

  private carregarCredenciais(): void {
    this.service.listarCredenciais(this.eventoId).subscribe({
      next: credenciais => this.credenciais.set(credenciais),
      error: erro => {
        console.error('Erro ao carregar credenciais', erro);
        this.toastError('Não foi possível carregar as credenciais.');
      }
    });
  }

  alterarAbaOperacao(aba: string | number | undefined): void {
    this.abaOperacaoAtiva.set(aba as AbaOperacao);
  }

  alterarTipoRelatorio(tipo: TipoRelatorioOperacao): void {
    this.tipoRelatorioSelecionado.set(tipo);
  }

  alterarDuplaRelatorio(duplaId: number | null): void {
    this.duplaRelatorioSelecionada.set(duplaId);
  }

  alterarEquipeRelatorio(equipeId: number | null): void {
    this.equipeRelatorioSelecionada.set(equipeId);
  }

  alterarStatusCadernoRelatorio(status: StatusCadernoChoro | null): void {
    this.statusCadernoRelatorioSelecionado.set(status);
  }

  alterarSomenteAtivosRelatorio(valor: boolean): void {
    this.somenteAtivosRelatorio.set(valor);
  }

  limparFiltrosRelatorio(): void {
    this.duplaRelatorioSelecionada.set(null);
    this.equipeRelatorioSelecionada.set(null);
    this.statusCadernoRelatorioSelecionado.set(null);
    this.somenteAtivosRelatorio.set(true);
  }

  alterarTipoImpressao(tipo: TipoImpressaoOperacao): void {
    this.tipoImpressaoSelecionado.set(tipo);
  }

  alterarModeloEtiquetaQr(modelo: ModeloEtiquetaQr): void {
    this.modeloEtiquetaQrSelecionado.set(modelo);
  }

  alterarModeloCracha(modelo: ModeloCrachaCredencial): void {
    this.modeloCrachaSelecionado.set(modelo);
  }

  alterarModeloCarteirinha(modelo: ModeloCarteirinhaCredencial): void {
    this.modeloCarteirinhaSelecionado.set(modelo);
  }

  alterarTipoCredencialImpressao(tipo: TipoCredencial | null): void {
    this.tipoCredencialImpressaoSelecionado.set(tipo);
  }

  alterarStatusCredencialImpressao(status: StatusCredencial | null): void {
    this.statusCredencialImpressaoSelecionado.set(status);
  }

  alterarFiltroTextoImpressao(valor: string): void {
    this.filtroTextoImpressao.set(valor);
  }

  limparFiltrosImpressao(): void {
    this.tipoImpressaoSelecionado.set('ETIQUETAS_QR');
    this.modeloEtiquetaQrSelecionado.set('PIMACO_A4356_63X25_33');
    this.modeloCrachaSelecionado.set('A4_2_COLUNAS_4');
    this.modeloCarteirinhaSelecionado.set('A4_10_CARTEIRINHAS');
    this.tipoCredencialImpressaoSelecionado.set(null);
    this.statusCredencialImpressaoSelecionado.set('ATIVA');
    this.filtroTextoImpressao.set('');
  }

  alterarFiltroCadernos(valor: string): void {
    this.filtroCadernos.set(valor);
  }

  alterarDuplaCadernoSelecionada(
    duplaId: number | null
  ): void {
    this.duplaCadernoSelecionada.set(duplaId);
    this.limparSelecaoCadernos();
  }


  alterarEquipeCadernoSelecionada(equipeId: number | null): void {
    this.equipeCadernoSelecionada.set(equipeId);
  }

  alterarStatusCadernoSelecionado(
    status: StatusCadernoChoro | null
  ): void {
    this.statusCadernoSelecionado.set(status);
    this.limparSelecaoCadernos();
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
    this.limparSelecaoCadernos();
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

  emitirImpressaoOperacao(): void {
    if (this.baixandoImpressao()) {
      return;
    }

    this.baixandoImpressao.set(true);

    const tipoImpressao = this.tipoImpressaoSelecionado();
    const filtrosComuns = {
      tipo: this.tipoCredencialImpressaoSelecionado(),
      status: this.statusCredencialImpressaoSelecionado(),
      filtro: this.filtroTextoImpressao()
    };

    const requisicao = (() => {
      if (tipoImpressao === 'CRACHAS') {
        return this.service.baixarCrachasCredenciais(this.eventoId, {
          ...filtrosComuns,
          modelo: this.modeloCrachaSelecionado()
        });
      }

      if (tipoImpressao === 'CARTEIRINHAS') {
        return this.service.baixarCarteirinhasCredenciais(this.eventoId, {
          ...filtrosComuns,
          modelo: this.modeloCarteirinhaSelecionado()
        });
      }

      if (tipoImpressao === 'LISTA_ENCONTRISTAS') {
        return this.service.baixarListaPresencaEncontristas(this.eventoId, {
          somenteAtivos: true
        });
      }

      if (tipoImpressao === 'LISTA_TIOS_CARONA') {
        return this.service.baixarListaPresencaTiosCarona(this.eventoId, {
          somenteAtivos: true
        });
      }

      return this.service.baixarEtiquetasQrCode(this.eventoId, {
        ...filtrosComuns,
        modelo: this.modeloEtiquetaQrSelecionado()
      });
    })();

    requisicao
      .pipe(finalize(() => this.baixandoImpressao.set(false)))
      .subscribe({
        next: arquivo => {
          this.salvarArquivoPdf(
            arquivo,
            tipoImpressao === 'CRACHAS'
              ? this.nomeArquivoCrachas()
              : tipoImpressao === 'CARTEIRINHAS'
                ? this.nomeArquivoCarteirinhas()
                : tipoImpressao === 'LISTA_ENCONTRISTAS'
                  ? this.nomeArquivoListaPresenca('ENCONTRISTAS')
                  : tipoImpressao === 'LISTA_TIOS_CARONA'
                    ? this.nomeArquivoListaPresenca('TIOS_CARONA')
                    : this.nomeArquivoEtiquetasQr()
          );
        },
        error: erro => {
          console.error('Erro ao gerar impressão oficial', erro);
          this.toastError(this.mensagemErro(erro, 'Não foi possível gerar a impressão oficial.'));
        }
      });
  }

  private nomeArquivoEtiquetasQr(): string {
    const eventoNome = this.evento()?.nome || `evento-${this.eventoId}`;
    const nomeSeguro = eventoNome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    return `etiquetas-qr-code-${nomeSeguro || this.eventoId}.pdf`;
  }

  private nomeArquivoCrachas(): string {
    const eventoNome = this.evento()?.nome || `evento-${this.eventoId}`;
    const nomeSeguro = eventoNome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    return `crachas-credenciais-${nomeSeguro || this.eventoId}.pdf`;
  }

  private nomeArquivoCarteirinhas(): string {
    const eventoNome = this.evento()?.nome || `evento-${this.eventoId}`;
    const nomeSeguro = eventoNome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    return `carteirinhas-credenciais-${nomeSeguro || this.eventoId}.pdf`;
  }

  baixarListaPresencaEncontristas(): void {
    this.tipoRelatorioSelecionado.set('ENCONTRISTAS');
    this.emitirRelatorioOperacao();
  }

  baixarListaPresencaTiosCarona(): void {
    this.tipoRelatorioSelecionado.set('TIOS_CARONA');
    this.emitirRelatorioOperacao();
  }

  emitirRelatorioOperacao(): void {
    const tipo = this.tipoRelatorioSelecionado();

    if (tipo === 'CADERNOS') {
      this.baixarRelatorioCadernosEquipes(true, true);
      return;
    }

    this.baixarListaPresenca(tipo);
  }

  private baixarListaPresenca(tipo: TipoListaPresenca): void {
    if (this.baixandoListaPresenca()) {
      return;
    }

    this.baixandoListaPresenca.set(tipo);

    const filtros = {
      somenteAtivos: this.somenteAtivosRelatorio(),
      duplaId: this.duplaRelatorioSelecionada()
    };

    const requisicao = tipo === 'ENCONTRISTAS'
      ? this.service.baixarListaPresencaEncontristas(this.eventoId, filtros)
      : this.service.baixarListaPresencaTiosCarona(this.eventoId, filtros);

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
    this.tipoRelatorioSelecionado.set('CADERNOS');
    this.duplaRelatorioSelecionada.set(null);
    this.equipeRelatorioSelecionada.set(null);
    this.statusCadernoRelatorioSelecionado.set(null);
    this.baixarRelatorioCadernosEquipes(false, false);
  }

  baixarRelatorioCadernosFiltrado(): void {
    this.tipoRelatorioSelecionado.set('CADERNOS');
    this.equipeRelatorioSelecionada.set(this.equipeCadernoSelecionada());
    this.statusCadernoRelatorioSelecionado.set(this.statusCadernoSelecionado());
    this.baixarRelatorioCadernosEquipes(true, false);
  }

  private baixarRelatorioCadernosEquipes(aplicarFiltros: boolean, usarFiltrosAbaRelatorios: boolean): void {
    if (this.baixandoRelatorioCadernos()) {
      return;
    }

    const filtros = aplicarFiltros
      ? usarFiltrosAbaRelatorios
        ? {
          duplaId: this.duplaRelatorioSelecionada(),
          equipeId: this.equipeRelatorioSelecionada(),
          status: this.statusCadernoRelatorioSelecionado()
        }
        : {
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

  conferirCaderno(caderno: CadernoChoro): void {
    this.abrirOperacaoCaderno(caderno, 'CONFERIDO');
  }

  anexarCadernoAoKit(caderno: CadernoChoro): void {
    this.abrirOperacaoCaderno(caderno, 'ANEXADO_AO_KIT');
  }

  entregarCadernoAoSobrinho(caderno: CadernoChoro): void {
    this.abrirOperacaoCaderno(caderno, 'ENTREGUE_AO_SOBRINHO');
  }

  abrirHistoricoCaderno(
    caderno: CadernoChoro
  ): void {
    this.cadernoSelecionado.set(caderno);
    this.timelineCaderno.set(null);
    this.viaTimelineSelecionadaId.set(null);
    this.historicoCadernoVisivel.set(true);
    this.carregandoHistoricoCaderno.set(true);

    this.service
      .listarTimelineCaderno(
        this.eventoId,
        caderno.sobrinhoId
      )
      .pipe(
        finalize(() =>
          this.carregandoHistoricoCaderno.set(false)
        )
      )
      .subscribe({
        next: timeline => {
          this.timelineCaderno.set(timeline);

          this.viaTimelineSelecionadaId.set(
            timeline.vias.length > 1
              ? null
              : timeline.cadernoAtualId
          );
        },
        error: erro => {
          console.error(
            'Erro ao carregar timeline consolidada do caderno',
            erro
          );

          this.toastError(
            this.mensagemErro(
              erro,
              'Não foi possível carregar a timeline do Caderno de Mensagens.'
            )
          );
        }
      });
  }

  fecharHistoricoCaderno(): void {
    this.historicoCadernoVisivel.set(false);
    this.timelineCaderno.set(null);
    this.viaTimelineSelecionadaId.set(null);
    this.cadernoSelecionado.set(null);
  }

  selecionarViaTimeline(
    cadernoId: number
  ): void {
    const timeline = this.timelineCaderno();

    if (
      !timeline ||
      !timeline.vias.some(via => via.id === cadernoId)
    ) {
      return;
    }

    this.viaTimelineSelecionadaId.set(cadernoId);
  }

  mostrarTodasMovimentacoesTimeline(): void {
    this.viaTimelineSelecionadaId.set(null);
  }

  viaSelecionadaNaTimeline(
    cadernoId: number
  ): boolean {
    return this.viaTimelineSelecionadaId() === cadernoId;
  }

  abrirAcoesEspeciaisCaderno(caderno: CadernoChoro): void {
    this.cadernoSelecionado.set(caderno);
    this.acaoEspecialCadernoSelecionada.set(null);
    this.observacaoAcaoEspecialCaderno.set('');
    this.danoImpedeContinuacaoCaderno.set(true);
    this.motivoSubstituicaoCaderno.set(null);
    this.motivoCancelamentoCaderno.set(null);
    this.acoesEspeciaisCadernoVisivel.set(true);
  }

  fecharAcoesEspeciaisCaderno(): void {
    if (this.processandoCadernoId() !== null) {
      return;
    }

    this.acoesEspeciaisCadernoVisivel.set(false);
    this.acaoEspecialCadernoSelecionada.set(null);
    this.observacaoAcaoEspecialCaderno.set('');
    this.danoImpedeContinuacaoCaderno.set(true);
    this.motivoSubstituicaoCaderno.set(null);
    this.motivoCancelamentoCaderno.set(null);
  }

  selecionarAcaoEspecialCaderno(
    acao: AcaoEspecialCaderno
  ): void {
    const caderno = this.cadernoSelecionado();

    if (!caderno || !this.acaoEspecialDisponivel(caderno, acao)) {
      return;
    }

    this.acaoEspecialCadernoSelecionada.set(acao);
    this.observacaoAcaoEspecialCaderno.set('');

    if (acao === 'DANO') {
      this.danoImpedeContinuacaoCaderno.set(true);
    }

    if (acao === 'SUBSTITUIR') {
      this.motivoSubstituicaoCaderno.set(
        caderno.status === 'PERDIDO'
          ? 'PERDA'
          : caderno.status === 'DANIFICADO'
            ? 'DANO'
            : null
      );
    } else {
      this.motivoSubstituicaoCaderno.set(null);
    }

    if (acao === 'CANCELAR') {
      this.motivoCancelamentoCaderno.set(null);
    } else {
      this.motivoCancelamentoCaderno.set(null);
    }
  }

  voltarParaAcoesEspeciaisCaderno(): void {
    if (this.processandoCadernoId() !== null) {
      return;
    }

    this.acaoEspecialCadernoSelecionada.set(null);
    this.observacaoAcaoEspecialCaderno.set('');
    this.danoImpedeContinuacaoCaderno.set(true);
    this.motivoSubstituicaoCaderno.set(null);
    this.motivoCancelamentoCaderno.set(null);
  }

  alterarObservacaoAcaoEspecialCaderno(
    observacao: string
  ): void {
    this.observacaoAcaoEspecialCaderno.set(observacao);
  }

  alterarDanoImpedeContinuacaoCaderno(
    valor: boolean
  ): void {
    this.danoImpedeContinuacaoCaderno.set(valor);
  }

  alterarMotivoSubstituicaoCaderno(
    motivo: MotivoSubstituicaoCaderno | null
  ): void {
    this.motivoSubstituicaoCaderno.set(motivo);
  }

  alterarMotivoCancelamentoCaderno(
    motivo: MotivoCancelamentoCaderno | null
  ): void {
    this.motivoCancelamentoCaderno.set(motivo);
  }

  formularioAcaoEspecialValido(): boolean {
    const acao = this.acaoEspecialCadernoSelecionada();
    const observacao =
      this.observacaoAcaoEspecialCaderno().trim();

    if (
      !acao ||
      !observacao ||
      observacao.length > 500 ||
      this.processandoCadernoId() !== null
    ) {
      return false;
    }

    if (
      acao === 'SUBSTITUIR' &&
      this.motivoSubstituicaoCaderno() === null
    ) {
      return false;
    }

    if (
      acao === 'CANCELAR' &&
      this.motivoCancelamentoCaderno() === null
    ) {
      return false;
    }

    const caderno = this.cadernoSelecionado();

    return !!caderno &&
      this.acaoEspecialDisponivel(caderno, acao);
  }

  private limparFormularioAcaoEspecial(
    fecharDialogo: boolean
  ): void {
    this.acaoEspecialCadernoSelecionada.set(null);
    this.observacaoAcaoEspecialCaderno.set('');
    this.danoImpedeContinuacaoCaderno.set(true);
    this.motivoSubstituicaoCaderno.set(null);
    this.motivoCancelamentoCaderno.set(null);

    if (fecharDialogo) {
      this.acoesEspeciaisCadernoVisivel.set(false);
    }
  }

  confirmarAcaoEspecialCaderno(): void {
    const caderno = this.cadernoSelecionado();
    const acao = this.acaoEspecialCadernoSelecionada();
    const observacao =
      this.observacaoAcaoEspecialCaderno().trim();

    if (!caderno || !acao) {
      this.toastWarn('Selecione uma ação especial válida.');
      return;
    }

    if (!observacao) {
      this.toastWarn(
        'Informe uma observação para registrar a ação.'
      );
      return;
    }

    if (observacao.length > 500) {
      this.toastWarn(
        'A observação deve possuir no máximo 500 caracteres.'
      );
      return;
    }

    if (!this.acaoEspecialDisponivel(caderno, acao)) {
      this.toastWarn(
        'A ação selecionada não está disponível para o status atual.'
      );
      return;
    }

    if (
      acao === 'SUBSTITUIR' &&
      this.motivoSubstituicaoCaderno() === null
    ) {
      this.toastWarn(
        'Selecione o motivo da substituição.'
      );
      return;
    }

    if (
      acao === 'CANCELAR' &&
      this.motivoCancelamentoCaderno() === null
    ) {
      this.toastWarn(
        'Selecione o motivo do cancelamento.'
      );
      return;
    }

    if (acao === 'SUBSTITUIR') {
      this.confirmationService.confirm({
        header: 'Confirmar substituição de via',
        icon: 'fa-solid fa-triangle-exclamation',
        message:
          `A Via ${caderno.numeroVia} será encerrada e uma nova via ` +
          `será criada para ${caderno.sobrinhoNome}. Confirma?`,
        acceptLabel: 'Criar nova via',
        rejectLabel: 'Voltar',
        acceptButtonProps: {
          severity: 'warn'
        },
        rejectButtonProps: {
          severity: 'secondary',
          variant: 'outlined'
        },
        accept: () =>
          this.executarAcaoEspecialCaderno(
            caderno,
            acao,
            observacao
          )
      });
      return;
    }

    if (acao === 'CANCELAR') {
      const motivo = this.motivoCancelamentoCaderno();

      this.confirmationService.confirm({
        header: 'Confirmar cancelamento do caderno',
        icon: 'fa-solid fa-triangle-exclamation',
        message:
          `A Via ${caderno.numeroVia} de ${caderno.sobrinhoNome} ` +
          `será encerrada como cancelada. Esta ação não cria uma nova via. ` +
          `Confirma o cancelamento?`,
        acceptLabel: 'Cancelar caderno',
        rejectLabel: 'Voltar',
        acceptButtonProps: {
          severity: 'danger'
        },
        rejectButtonProps: {
          severity: 'secondary',
          variant: 'outlined'
        },
        accept: () => {
          if (motivo) {
            this.executarAcaoEspecialCaderno(
              caderno,
              acao,
              observacao
            );
          }
        }
      });
      return;
    }

    this.executarAcaoEspecialCaderno(
      caderno,
      acao,
      observacao
    );
  }

  private executarAcaoEspecialCaderno(
    caderno: CadernoChoro,
    acao: AcaoEspecialCaderno,
    observacao: string
  ): void {
    this.processandoCadernoId.set(caderno.id);

    if (acao === 'CANCELAR') {
      const motivo = this.motivoCancelamentoCaderno();

      if (!motivo) {
        this.processandoCadernoId.set(null);
        this.toastWarn(
          'Selecione o motivo do cancelamento.'
        );
        return;
      }

      const request: CadernoChoroCancelarRequest = {
        motivo,
        observacao
      };

      this.service
        .cancelarViaCaderno(
          this.eventoId,
          caderno.id,
          request
        )
        .pipe(
          finalize(() =>
            this.processandoCadernoId.set(null)
          )
        )
        .subscribe({
          next: cadernoAtualizado => {
            this.atualizarCadernoNaLista(cadernoAtualizado);
            this.limparFormularioAcaoEspecial(true);

            this.toastSuccess(
              `Caderno de ${cadernoAtualizado.sobrinhoNome} cancelado.`
            );
          },
          error: erro => {
            console.error(
              'Erro ao cancelar o caderno',
              erro
            );

            this.toastError(
              this.mensagemErro(
                erro,
                'Não foi possível cancelar o Caderno de Mensagens.'
              )
            );
          }
        });

      return;
    }

    if (acao === 'SUBSTITUIR') {
      const motivo = this.motivoSubstituicaoCaderno();

      if (!motivo) {
        this.processandoCadernoId.set(null);
        this.toastWarn(
          'Selecione o motivo da substituição.'
        );
        return;
      }

      const request: CadernoChoroSubstituirRequest = {
        motivo,
        observacao
      };

      this.service
        .substituirViaCaderno(
          this.eventoId,
          caderno.id,
          request
        )
        .pipe(
          finalize(() =>
            this.processandoCadernoId.set(null)
          )
        )
        .subscribe({
          next: resultado => {
            this.substituirViaAtualNaLista(
              resultado.viaSubstituida,
              resultado.novaVia
            );

            this.limparFormularioAcaoEspecial(true);

            this.toastSuccess(
              `Via ${resultado.novaVia.numeroVia} criada para ` +
              `${resultado.novaVia.sobrinhoNome}.`
            );
          },
          error: erro => {
            console.error(
              'Erro ao substituir a via do caderno',
              erro
            );

            this.toastError(
              this.mensagemErro(
                erro,
                'Não foi possível substituir a via do Caderno de Mensagens.'
              )
            );
          }
        });

      return;
    }

    const requisicao = (() => {
      switch (acao) {
        case 'PERDA': {
          const request: CadernoChoroOcorrenciaRequest = {
            tipo: 'PERDA',
            impedeContinuacao: true,
            observacao
          };

          return this.service.registrarOcorrenciaCaderno(
            this.eventoId,
            caderno.id,
            request
          );
        }

        case 'DANO': {
          const request: CadernoChoroOcorrenciaRequest = {
            tipo: 'DANO',
            impedeContinuacao:
              this.danoImpedeContinuacaoCaderno(),
            observacao
          };

          return this.service.registrarOcorrenciaCaderno(
            this.eventoId,
            caderno.id,
            request
          );
        }

        case 'RECUPERAR': {
          const request: CadernoChoroRecuperarRequest = {
            observacao
          };

          return this.service.recuperarCaderno(
            this.eventoId,
            caderno.id,
            request
          );
        }
      }
    })();

    requisicao
      .pipe(
        finalize(() =>
          this.processandoCadernoId.set(null)
        )
      )
      .subscribe({
        next: cadernoAtualizado => {
          this.atualizarCadernoNaLista(cadernoAtualizado);
          this.limparFormularioAcaoEspecial(true);

          this.toastSuccess(
            this.mensagemSucessoAcaoEspecial(
              acao,
              cadernoAtualizado
            )
          );
        },
        error: erro => {
          console.error(
            'Erro ao registrar ação especial do caderno',
            erro
          );

          this.toastError(
            this.mensagemErro(
              erro,
              'Não foi possível concluir a ação especial.'
            )
          );
        }
      });
  }

  private substituirViaAtualNaLista(
    viaSubstituida: CadernoChoro,
    novaVia: CadernoChoro
  ): void {
    this.cadernos.update(cadernos => {
      const possuiViaAnterior = cadernos.some(
        item => item.id === viaSubstituida.id
      );

      const atualizados = possuiViaAnterior
        ? cadernos.map(item =>
          item.id === viaSubstituida.id
            ? novaVia
            : item
        )
        : [...cadernos, novaVia];

      return atualizados.sort((a, b) =>
        a.sobrinhoNome.localeCompare(
          b.sobrinhoNome,
          'pt-BR'
        )
      );
    });

    this.cadernoSelecionado.set(novaVia);
  }

  private mensagemSucessoAcaoEspecial(
    acao: Exclude<
      AcaoEspecialCaderno,
      'SUBSTITUIR' | 'CANCELAR'
    >,
    caderno: CadernoChoro
  ): string {
    switch (acao) {
      case 'PERDA':
        return `Perda registrada para ${caderno.sobrinhoNome}.`;

      case 'DANO':
        return this.danoImpedeContinuacaoCaderno()
          ? `Dano impeditivo registrado para ${caderno.sobrinhoNome}.`
          : `Dano informativo registrado para ${caderno.sobrinhoNome}.`;

      case 'RECUPERAR':
        return `Caderno de ${caderno.sobrinhoNome} recuperado e devolvido à etapa anterior.`;
    }
  }

  acaoEspecialDisponivel(
    caderno: CadernoChoro,
    acao: AcaoEspecialCaderno
  ): boolean {
    switch (acao) {
      case 'PERDA':
      case 'DANO':
        return this.podeRegistrarOcorrenciaCaderno(caderno);

      case 'RECUPERAR':
        return this.podeRecuperarCaderno(caderno);

      case 'SUBSTITUIR':
        return this.podeSubstituirViaCaderno(caderno);

      case 'CANCELAR':
        return this.podeCancelarCaderno(caderno);
    }
  }

  podeRegistrarOcorrenciaCaderno(
    caderno: CadernoChoro
  ): boolean {
    return caderno.viaAtual &&
      ![
        'PERDIDO',
        'DANIFICADO',
        'SUBSTITUIDO',
        'CANCELADO',
        'ENTREGUE_AO_SOBRINHO'
      ].includes(caderno.status);
  }

  podeRecuperarCaderno(
    caderno: CadernoChoro
  ): boolean {
    return caderno.viaAtual &&
      ['PERDIDO', 'DANIFICADO'].includes(
        caderno.status
      );
  }

  podeSubstituirViaCaderno(
    caderno: CadernoChoro
  ): boolean {
    return caderno.viaAtual &&
      ![
        'SUBSTITUIDO',
        'CANCELADO',
        'ENTREGUE_AO_SOBRINHO'
      ].includes(caderno.status);
  }

  tituloAcaoEspecialCaderno(): string {
    switch (this.acaoEspecialCadernoSelecionada()) {
      case 'PERDA':
        return 'Registrar perda';

      case 'DANO':
        return 'Registrar dano';

      case 'RECUPERAR':
        return 'Recuperar caderno';

      case 'SUBSTITUIR':
        return 'Substituir via';

      case 'CANCELAR':
        return 'Cancelar caderno';

      default:
        return 'Ações especiais';
    }
  }

  descricaoAcaoEspecialCaderno(): string {
    switch (this.acaoEspecialCadernoSelecionada()) {
      case 'PERDA':
        return 'A perda interrompe o fluxo atual e exige recuperação ou substituição da via.';

      case 'DANO':
        return 'O dano pode ser somente informativo ou impedir a continuidade do fluxo físico.';

      case 'RECUPERAR':
        return 'O caderno retornará à etapa em que estava antes da ocorrência.';

      case 'SUBSTITUIR':
        return 'A via atual será encerrada e uma nova via física será criada como pendente.';

      case 'CANCELAR':
        return 'A via atual será encerrada sem gerar automaticamente uma nova via.';

      default:
        return 'Selecione a ocorrência ou ação necessária.';
    }
  }

  labelBotaoAcaoEspecialCaderno(): string {
    switch (this.acaoEspecialCadernoSelecionada()) {
      case 'PERDA':
        return 'Registrar perda';

      case 'DANO':
        return 'Registrar dano';

      case 'RECUPERAR':
        return 'Confirmar recuperação';

      case 'SUBSTITUIR':
        return 'Criar nova via';

      case 'CANCELAR':
        return 'Cancelar caderno';

      default:
        return 'Confirmar';
    }
  }

  severityAcaoEspecialCaderno():
    | 'info'
    | 'success'
    | 'warn'
    | 'danger' {
    switch (this.acaoEspecialCadernoSelecionada()) {
      case 'PERDA':
        return 'danger';

      case 'DANO':
      case 'SUBSTITUIR':
        return 'warn';

      case 'CANCELAR':
        return 'danger';

      case 'RECUPERAR':
        return 'success';

      default:
        return 'info';
    }
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
      default:
        return 'info';
    }
  }

  abrirScannerTio(operacao: TipoOperacaoScannerTio): void {
    if (!this.seguranca.podeEscrever()) {
      this.toastWarn('Seu perfil não permite registrar check-in ou check-out.');
      return;
    }

    this.tipoOperacaoScannerTio.set(operacao);
    this.codigoForm.controls.tipoOperacao.setValue(operacao);
    this.resultadoScannerTio.set(null);
    this.scannerTioVisivel.set(true);
  }

  fecharScannerTio(): void {
    if (this.processandoCodigo()) {
      return;
    }

    this.scannerTioVisivel.set(false);
    this.resultadoScannerTio.set(null);
  }

  alterarOperacaoScannerTio(
    operacao: TipoOperacaoScannerTio
  ): void {
    if (this.processandoCodigo()) {
      return;
    }

    this.tipoOperacaoScannerTio.set(operacao);
    this.codigoForm.controls.tipoOperacao.setValue(operacao);
    this.resultadoScannerTio.set(null);
  }

  aoLerQrTioCarona(leitura: QrCodeLeitura): void {
    this.processarCodigoTioCarona(
      leitura.texto,
      this.tipoOperacaoScannerTio()
    );
  }

  registrarOperacaoPorCodigo(): void {
    if (this.codigoForm.invalid) {
      this.codigoForm.markAllAsTouched();
      this.toastWarn(
        'Informe o código da credencial para registrar a operação.'
      );
      return;
    }

    const valor = this.codigoForm.getRawValue();

    this.processarCodigoTioCarona(
      valor.codigoIdentificacao,
      valor.tipoOperacao
    );
  }

  private processarCodigoTioCarona(
    codigoInformado: string,
    operacao: TipoOperacaoScannerTio
  ): void {
    if (this.processandoCodigo()) {
      return;
    }

    const codigo =
      this.normalizarCodigoCredencial(codigoInformado);

    if (!codigo) {
      this.registrarResultadoScannerTio({
        status: 'ATENCAO',
        operacao,
        mensagem: 'Informe uma credencial válida.',
        ocorridoEm: new Date()
      });
      return;
    }

    this.processandoCodigo.set(true);
    this.codigoForm.controls.codigoIdentificacao.setValue(
      codigo,
      { emitEvent: false }
    );

    const requisicao =
      operacao === 'CHECKIN'
        ? this.service.registrarCheckinPorCodigo(
            this.eventoId,
            codigo
          )
        : this.service.registrarCheckoutPorCodigo(
            this.eventoId,
            codigo
          );

    requisicao
      .pipe(finalize(() => this.processandoCodigo.set(false)))
      .subscribe({
        next: tioAtualizado => {
          this.atualizarTioCaronaNaLista(tioAtualizado);
          this.limparFormularioCodigoTio(operacao);

          const mensagem =
            operacao === 'CHECKIN'
              ? 'Check-in realizado com sucesso.'
              : 'Check-out realizado com sucesso.';

          this.registrarResultadoScannerTio({
            status: 'SUCESSO',
            operacao,
            mensagem,
            pessoaNome: tioAtualizado.pessoaNome,
            ocorridoEm: new Date()
          });

          this.toastSuccess(
            `${mensagem.replace('.', '')} para ${tioAtualizado.pessoaNome}.`
          );
        },
        error: erro => {
          console.error(
            'Erro ao registrar operação por QR Code',
            erro
          );

          const mensagem = this.mensagemErro(
            erro,
            'Não foi possível registrar a operação por QR Code.'
          );

          this.registrarResultadoScannerTio({
            status: this.erroOperacaoJaRealizada(mensagem)
              ? 'ATENCAO'
              : 'ERRO',
            operacao,
            mensagem,
            ocorridoEm: new Date()
          });

          if (this.erroOperacaoJaRealizada(mensagem)) {
            this.toastWarn(mensagem);
          } else {
            this.toastError(mensagem);
          }
        }
      });
  }

  private registrarResultadoScannerTio(
    resultado: ResultadoScannerTio
  ): void {
    this.resultadoScannerTio.set(resultado);
  }

  private erroOperacaoJaRealizada(
    mensagem: string
  ): boolean {
    const mensagemNormalizada =
      this.normalizarFiltro(mensagem);

    return (
      mensagemNormalizada.includes('ja realizou check-in') ||
      mensagemNormalizada.includes('check-in ja realizado') ||
      mensagemNormalizada.includes('ja possui check-in') ||
      mensagemNormalizada.includes('ja realizou checkout') ||
      mensagemNormalizada.includes('checkout ja realizado') ||
      mensagemNormalizada.includes('ultimo registro ja e checkout')
    );
  }

  classeResultadoScannerTio(
    status: StatusResultadoScannerTio
  ): string {
    switch (status) {
      case 'SUCESSO':
        return 'resultado-sucesso';
      case 'ATENCAO':
        return 'resultado-atencao';
      default:
        return 'resultado-erro';
    }
  }

  iconeResultadoScannerTio(
    status: StatusResultadoScannerTio
  ): string {
    switch (status) {
      case 'SUCESSO':
        return 'fa-solid fa-circle-check';
      case 'ATENCAO':
        return 'fa-solid fa-triangle-exclamation';
      default:
        return 'fa-solid fa-circle-xmark';
    }
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

  abrirScannerEncontrista(
    operacao: OperacaoPresencaSobrinho
  ): void {
    if (!this.seguranca.podeEscrever()) {
      this.toastWarn(
        'Seu perfil não permite registrar presença de encontristas.'
      );
      return;
    }

    this.operacaoScannerEncontrista.set(operacao);
    this.codigoSobrinhoForm.controls.operacao.setValue(operacao);
    this.resultadoScannerEncontrista.set(null);
    this.scannerEncontristaVisivel.set(true);
  }

  fecharScannerEncontrista(): void {
    if (this.processandoCodigoSobrinho()) {
      return;
    }

    this.scannerEncontristaVisivel.set(false);
    this.resultadoScannerEncontrista.set(null);
  }

  alterarOperacaoScannerEncontrista(
    operacao: OperacaoPresencaSobrinho
  ): void {
    if (this.processandoCodigoSobrinho()) {
      return;
    }

    this.operacaoScannerEncontrista.set(operacao);
    this.codigoSobrinhoForm.controls.operacao.setValue(operacao);
    this.resultadoScannerEncontrista.set(null);
  }

  aoLerQrEncontrista(leitura: QrCodeLeitura): void {
    this.processarCodigoEncontrista(
      leitura.texto,
      this.operacaoScannerEncontrista()
    );
  }

  registrarPresencaSobrinhoPorCodigo(): void {
    if (this.codigoSobrinhoForm.invalid) {
      this.codigoSobrinhoForm.markAllAsTouched();
      this.toastWarn(
        'Informe o código da credencial do encontrista.'
      );
      return;
    }

    const valor = this.codigoSobrinhoForm.getRawValue();

    this.processarCodigoEncontrista(
      valor.codigoIdentificacao,
      valor.operacao
    );
  }

  private processarCodigoEncontrista(
    codigoInformado: string,
    operacao: OperacaoPresencaSobrinho
  ): void {
    if (this.processandoCodigoSobrinho()) {
      return;
    }

    const codigo =
      this.normalizarCodigoCredencial(codigoInformado);

    if (!codigo) {
      this.registrarResultadoScannerEncontrista({
        status: 'ATENCAO',
        operacao,
        mensagem: 'Informe uma credencial válida.',
        ocorridoEm: new Date()
      });
      return;
    }

    this.processandoCodigoSobrinho.set(true);
    this.codigoSobrinhoForm.controls.codigoIdentificacao.setValue(
      codigo,
      { emitEvent: false }
    );

    this.service.registrarPresencaSobrinhoPorCodigo(
      this.eventoId,
      codigo,
      operacao,
      'Leitura via câmera do celular'
    )
      .pipe(
        finalize(() =>
          this.processandoCodigoSobrinho.set(false)
        )
      )
      .subscribe({
        next: sobrinhoAtualizado => {
          this.atualizarSobrinhoNaLista(sobrinhoAtualizado);
          this.limparFormularioCodigoSobrinho(operacao);

          const statusAtual =
            this.statusPresencaSobrinho(sobrinhoAtualizado);
          const mensagem =
            `${this.labelSobrinhoStatus(statusAtual)} registrado com sucesso.`;

          this.registrarResultadoScannerEncontrista({
            status: 'SUCESSO',
            operacao,
            mensagem,
            pessoaNome: sobrinhoAtualizado.nome,
            ocorridoEm: new Date()
          });

          this.toastSuccess(
            `${sobrinhoAtualizado.nome} marcado como ` +
            `${this.labelSobrinhoStatus(statusAtual).toLowerCase()}.`
          );
        },
        error: erro => {
          console.error(
            'Erro ao registrar presença por QR Code',
            erro
          );

          const mensagem = this.mensagemErro(
            erro,
            'Não foi possível registrar a situação pela credencial.'
          );
          const repetida =
            this.erroPresencaEncontristaJaRegistrada(mensagem);

          this.registrarResultadoScannerEncontrista({
            status: repetida ? 'ATENCAO' : 'ERRO',
            operacao,
            mensagem,
            ocorridoEm: new Date()
          });

          if (repetida) {
            this.toastWarn(mensagem);
          } else {
            this.toastError(mensagem);
          }
        }
      });
  }

  private registrarResultadoScannerEncontrista(
    resultado: ResultadoScannerEncontrista
  ): void {
    this.resultadoScannerEncontrista.set(resultado);
  }

  private erroPresencaEncontristaJaRegistrada(
    mensagem: string
  ): boolean {
    const mensagemNormalizada =
      this.normalizarFiltro(mensagem);

    return (
      mensagemNormalizada.includes('presenca ja registrada') ||
      mensagemNormalizada.includes('ausencia ja registrada') ||
      mensagemNormalizada.includes('desistencia ja registrada') ||
      mensagemNormalizada.includes('situacao ja esta registrada')
    );
  }

  labelOperacaoScannerEncontrista(
    operacao: OperacaoPresencaSobrinho
  ): string {
    switch (operacao) {
      case 'PRESENTE':
        return 'Presença';
      case 'AUSENTE':
        return 'Ausência';
      case 'DESISTENTE':
        return 'Desistência';
    }
  }

  registrarResultadoScannerEncontristaClasse(
    status: StatusResultadoScannerTio
  ): string {
    return this.classeResultadoScannerTio(status);
  }

  registrarResultadoScannerEncontristaIcone(
    status: StatusResultadoScannerTio
  ): string {
    return this.iconeResultadoScannerTio(status);
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
      case 'DANIFICADO':
        return 'Danificado';
      default:
        return status;
    }
  }

  labelMotivoEmissaoCaderno(
    motivo: MotivoEmissaoCaderno
  ): string {
    switch (motivo) {
      case 'GERACAO_INICIAL':
        return 'Geração inicial';

      case 'SUBSTITUICAO_PERDA':
        return 'Substituição por perda';

      case 'SUBSTITUICAO_DANO':
        return 'Substituição por dano';

      case 'SUBSTITUICAO_ERRO':
        return 'Substituição por erro';

      case 'RETOMADA_PARTICIPACAO':
        return 'Retomada da participação';

      case 'OUTRO':
        return 'Outro motivo';

      default:
        return motivo;
    }
  }

  labelMotivoCancelamentoCaderno(
    motivo?: MotivoCancelamentoCaderno | null
  ): string | null {
    if (!motivo) {
      return null;
    }

    switch (motivo) {
      case 'DESISTENCIA_ENCONTRISTA':
        return 'Desistência do encontrista';

      case 'NAO_PARTICIPOU_DO_EVENTO':
        return 'Não participou do evento';

      case 'ERRO_DE_CADASTRO':
        return 'Erro de cadastro';

      case 'CADERNO_NAO_NECESSARIO':
        return 'Caderno não necessário';

      case 'OUTRO':
        return 'Outro motivo';

      default:
        return motivo;
    }
  }

  labelMotivoSubstituicaoCaderno(
    motivo?: MotivoSubstituicaoCaderno | null
  ): string | null {
    if (!motivo) {
      return null;
    }

    switch (motivo) {
      case 'PERDA':
        return 'Perda';

      case 'DANO':
        return 'Dano';

      case 'ERRO_DE_IMPRESSAO':
        return 'Erro de impressão';

      case 'ERRO_DE_MONTAGEM':
        return 'Erro de montagem';

      case 'CONTEUDO_INUTILIZADO':
        return 'Conteúdo inutilizado';

      case 'OUTRO':
        return 'Outro motivo';

      default:
        return motivo;
    }
  }

  labelMovimentacaoCaderno(
    tipo: TipoMovimentacaoCaderno
  ): string {
    switch (tipo) {
      case 'CADERNO_GERADO':
        return 'Caderno gerado';

      case 'ENTREGA_A_DUPLA':
        return 'Entregue à dupla';

      case 'RECEBIMENTO_DA_DUPLA':
        return 'Recebido da dupla';

      case 'DIRECIONAMENTO_EQUIPE':
        return 'Direcionado à equipe do kit';

      case 'CONFERENCIA':
        return 'Conteúdo conferido';

      case 'ANEXACAO_KIT':
        return 'Anexado ao kit';

      case 'ENTREGA_ENCONTRISTA':
        return 'Entregue ao encontrista';

      case 'PERDA_REGISTRADA':
        return 'Perda registrada';

      case 'DANO_REGISTRADO':
        return 'Dano registrado';

      case 'CADERNO_RECUPERADO':
        return 'Caderno recuperado';

      case 'CADERNO_SUBSTITUIDO':
        return 'Via substituída';

      case 'NOVA_VIA_GERADA':
        return 'Nova via gerada';

      case 'CADERNO_CANCELADO':
        return 'Caderno cancelado';

      case 'DUPLA_ALTERADA':
        return 'Dupla responsável alterada';

      case 'ENCONTRISTA_DESISTENTE':
        return 'Desistência registrada';

      case 'PARTICIPACAO_RETOMADA':
        return 'Participação retomada';

      case 'RECOLHIMENTO_CONCLUIDO':
        return 'Recolhimento concluído';

      case 'MOVIMENTACAO_LEGADA':
        return 'Movimentação anterior';

      default:
        return tipo;
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
      case 'DANIFICADO':
        return 'danger';
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
      return statusAtual === 'PERDIDO' ||
        statusAtual === 'DANIFICADO' ||
        statusAtual === 'SUBSTITUIDO';
    }

    return statusAtual === statusFiltro;
  }

  private normalizarCorHex(cor?: string | null): string {
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

  alterarTipoOperacaoLoteCaderno(
    tipo: TipoOperacaoLoteCaderno
  ): void {
    if (
      this.tipoOperacaoLoteCaderno() === tipo
    ) {
      return;
    }

    this.tipoOperacaoLoteCaderno.set(tipo);
    this.limparSelecaoCadernos();
  }

  cadernoElegivelParaOperacaoLote(
    caderno: CadernoChoro
  ): boolean {
    if (!caderno.viaAtual) {
      return false;
    }

    switch (this.tipoOperacaoLoteCaderno()) {
      case 'ENTREGA':
        return caderno.status === 'PENDENTE';

      case 'RECEBIMENTO':
        return caderno.status ===
          'ENTREGUE_A_DUPLA';

      case 'RECOLHIMENTO':
        return caderno.status === 'CANCELADO' &&
          caderno.recolhimentoPendente;

      default:
        return false;
    }
  }

  cadernoSelecionadoParaOperacao(
    cadernoId: number
  ): boolean {
    return this.cadernosSelecionadosIds().has(
      cadernoId
    );
  }

  alterarSelecaoCaderno(
    caderno: CadernoChoro,
    selecionado: boolean
  ): void {
    if (
      selecionado &&
      !this.cadernoElegivelParaOperacaoLote(caderno)
    ) {
      return;
    }

    const ids = new Set(
      this.cadernosSelecionadosIds()
    );

    if (selecionado) {
      const selecionados =
        this.cadernosSelecionadosOperacaoLote();

      const duplaDiferente =
        selecionados.length > 0 &&
        selecionados[0].duplaId !==
        caderno.duplaId;

      if (duplaDiferente) {
        this.toastWarn(
          'Selecione cadernos de uma única dupla por operação.'
        );
        return;
      }

      ids.add(caderno.id);
    } else {
      ids.delete(caderno.id);
    }

    this.cadernosSelecionadosIds.set(ids);
  }

  alterarSelecaoTodosCadernosVisiveis(
    selecionado: boolean
  ): void {
    const elegiveis =
      this.cadernosElegiveisOperacaoLote();

    if (!selecionado) {
      const ids = new Set(
        this.cadernosSelecionadosIds()
      );

      elegiveis.forEach(caderno =>
        ids.delete(caderno.id)
      );

      this.cadernosSelecionadosIds.set(ids);
      return;
    }

    if (elegiveis.length === 0) {
      return;
    }

    /*
     * Uma operação só pode envolver uma dupla.
     *
     * Quando o filtro exibe mais de uma dupla, selecionamos
     * somente a primeira dupla elegível e avisamos o usuário.
     */
    const duplaId = elegiveis[0].duplaId;

    const mesmaDupla = elegiveis.filter(
      caderno => caderno.duplaId === duplaId
    );

    this.cadernosSelecionadosIds.set(
      new Set(mesmaDupla.map(caderno => caderno.id))
    );

    if (mesmaDupla.length !== elegiveis.length) {
      this.toastWarn(
        'Foram selecionados somente os cadernos da primeira dupla visível. Filtre uma dupla para selecionar todos os seus registros.'
      );
    }
  }

  limparSelecaoCadernos(): void {
    this.cadernosSelecionadosIds.set(
      new Set<number>()
    );

    this.tioOperacaoLoteCadernoId.set(null);
    this.observacaoOperacaoLoteCaderno.set('');
  }

  abrirOperacaoLoteCaderno(): void {
    if (!this.podeAbrirOperacaoLoteCaderno()) {
      this.toastWarn(
        'Selecione ao menos um caderno elegível de uma única dupla.'
      );
      return;
    }

    const opcoesTios =
      this.tiosDaDuplaOperacaoLote();

    if (opcoesTios.length === 0) {
      this.toastWarn(
        'A dupla selecionada não possui tio carona ativo disponível para registrar a operação.'
      );
      return;
    }

    this.tioOperacaoLoteCadernoId.set(
      opcoesTios.length === 1
        ? opcoesTios[0].value
        : null
    );

    this.observacaoOperacaoLoteCaderno.set('');
    this.operacaoLoteCadernoVisivel.set(true);
  }

  fecharOperacaoLoteCaderno(): void {
    if (this.processandoCadernos()) {
      return;
    }

    this.operacaoLoteCadernoVisivel.set(false);
    this.tioOperacaoLoteCadernoId.set(null);
    this.observacaoOperacaoLoteCaderno.set('');
  }

  alterarTioOperacaoLoteCaderno(
    tioCaronaEventoId: number | null
  ): void {
    this.tioOperacaoLoteCadernoId.set(
      tioCaronaEventoId
    );
  }

  alterarObservacaoOperacaoLoteCaderno(
    observacao: string
  ): void {
    this.observacaoOperacaoLoteCaderno.set(
      observacao
    );
  }

  tituloOperacaoLoteCaderno(): string {
    switch (this.tipoOperacaoLoteCaderno()) {
      case 'ENTREGA':
        return 'Entregar cadernos à dupla';

      case 'RECEBIMENTO':
        return 'Receber cadernos da dupla';

      case 'RECOLHIMENTO':
        return 'Recolher cadernos cancelados';

      default:
        return 'Operação dos cadernos';
    }
  }

  descricaoOperacaoLoteCaderno(): string {
    switch (this.tipoOperacaoLoteCaderno()) {
      case 'ENTREGA':
        return 'Confirme os exemplares físicos entregues à dupla e identifique o tio que os recebeu.';

      case 'RECEBIMENTO':
        return 'Confirme os exemplares devolvidos pela dupla e identifique o tio que realizou a devolução.';

      case 'RECOLHIMENTO':
        return 'Confirme o recolhimento físico dos exemplares cancelados que ainda estavam com a dupla.';

      default:
        return '';
    }
  }

  labelBotaoOperacaoLoteCaderno(): string {
    switch (this.tipoOperacaoLoteCaderno()) {
      case 'ENTREGA':
        return 'Confirmar entrega';

      case 'RECEBIMENTO':
        return 'Confirmar recebimento';

      case 'RECOLHIMENTO':
        return 'Confirmar recolhimento';

      default:
        return 'Confirmar';
    }
  }

  iconeOperacaoLoteCaderno(): string {
    switch (this.tipoOperacaoLoteCaderno()) {
      case 'ENTREGA':
        return 'fa-solid fa-hand-holding-heart';

      case 'RECEBIMENTO':
        return 'fa-solid fa-people-carry-box';

      case 'RECOLHIMENTO':
        return 'fa-solid fa-rotate-left';

      default:
        return 'fa-solid fa-check';
    }
  }

  iconeMovimentacaoCaderno(
    tipo: TipoMovimentacaoCaderno
  ): string {
    switch (tipo) {
      case 'CADERNO_GERADO':
        return 'fa-solid fa-file-circle-plus';

      case 'ENTREGA_A_DUPLA':
        return 'fa-solid fa-hand-holding-heart';

      case 'RECEBIMENTO_DA_DUPLA':
        return 'fa-solid fa-people-carry-box';

      case 'DIRECIONAMENTO_EQUIPE':
        return 'fa-solid fa-people-group';

      case 'CONFERENCIA':
        return 'fa-solid fa-clipboard-check';

      case 'ANEXACAO_KIT':
        return 'fa-solid fa-box';

      case 'ENTREGA_ENCONTRISTA':
        return 'fa-solid fa-gift';

      case 'PERDA_REGISTRADA':
        return 'fa-solid fa-triangle-exclamation';

      case 'DANO_REGISTRADO':
        return 'fa-solid fa-heart-crack';

      case 'CADERNO_RECUPERADO':
        return 'fa-solid fa-rotate-left';

      case 'CADERNO_SUBSTITUIDO':
        return 'fa-solid fa-arrow-right-arrow-left';

      case 'NOVA_VIA_GERADA':
        return 'fa-solid fa-copy';

      case 'CADERNO_CANCELADO':
        return 'fa-solid fa-ban';

      case 'DUPLA_ALTERADA':
        return 'fa-solid fa-people-arrows';

      case 'ENCONTRISTA_DESISTENTE':
        return 'fa-solid fa-person-walking-arrow-right';

      case 'PARTICIPACAO_RETOMADA':
        return 'fa-solid fa-person-circle-check';

      case 'RECOLHIMENTO_CONCLUIDO':
        return 'fa-solid fa-box-archive';

      default:
        return 'fa-solid fa-circle';
    }
  }

  severityOperacaoLoteCaderno():
    | 'info'
    | 'warn'
    | 'danger' {
    switch (this.tipoOperacaoLoteCaderno()) {
      case 'ENTREGA':
        return 'info';

      case 'RECEBIMENTO':
        return 'warn';

      case 'RECOLHIMENTO':
        return 'danger';
    }
  }

  severityViaTimeline(
    via: CadernoChoro
  ): 'info' | 'success' | 'warn' | 'danger' | 'secondary' {
    if (via.viaAtual) {
      return this.severityStatusCaderno(via.status);
    }

    if (via.status === 'SUBSTITUIDO') {
      return 'warn';
    }

    if (via.status === 'CANCELADO') {
      return 'secondary';
    }

    return 'info';
  }

  solicitarConfirmacaoOperacaoLoteCaderno(): void {
    if (!this.podeConfirmarOperacaoLoteCaderno()) {
      this.toastWarn(
        'Selecione o tio carona responsável pela operação.'
      );
      return;
    }

    const quantidade =
      this.quantidadeCadernosSelecionados();

    const dupla = this.duplaOperacaoLote();

    this.confirmationService.confirm({
      header: this.tituloOperacaoLoteCaderno(),
      icon: 'fa-solid fa-triangle-exclamation',
      message:
        `Confirma a operação de ${quantidade} ` +
        `caderno(s) da dupla ` +
        `${dupla?.apelido || dupla?.codigo}?`,
      acceptLabel: this.labelBotaoOperacaoLoteCaderno(),
      rejectLabel: 'Voltar',
      acceptButtonProps: {
        severity: this.severityOperacaoLoteCaderno()
      },
      rejectButtonProps: {
        severity: 'secondary',
        variant: 'outlined'
      },
      accept: () =>
        this.executarOperacaoLoteCaderno()
    });
  }

  classeMovimentacaoCaderno(
    tipo: TipoMovimentacaoCaderno
  ): string {
    switch (tipo) {
      case 'PERDA_REGISTRADA':
      case 'DANO_REGISTRADO':
      case 'CADERNO_CANCELADO':
      case 'ENCONTRISTA_DESISTENTE':
        return 'timeline-evento-danger';

      case 'CADERNO_SUBSTITUIDO':
      case 'NOVA_VIA_GERADA':
      case 'PARTICIPACAO_RETOMADA':
        return 'timeline-evento-warn';

      case 'ENTREGA_ENCONTRISTA':
      case 'CADERNO_RECUPERADO':
      case 'RECOLHIMENTO_CONCLUIDO':
        return 'timeline-evento-success';

      default:
        return 'timeline-evento-info';
    }
  }

  descricaoTransicaoMovimentacao(
    item: CadernoChoroHistorico
  ): string | null {
    if (
      !item.statusAnterior &&
      !item.statusNovo
    ) {
      return null;
    }

    if (
      item.statusAnterior === item.statusNovo &&
      item.statusNovo
    ) {
      return this.labelStatusCaderno(
        item.statusNovo
      );
    }

    if (!item.statusAnterior && item.statusNovo) {
      return this.labelStatusCaderno(
        item.statusNovo
      );
    }

    if (item.statusAnterior && !item.statusNovo) {
      return this.labelStatusCaderno(
        item.statusAnterior
      );
    }

    return (
      `${this.labelStatusCaderno(item.statusAnterior!)} ` +
      `→ ${this.labelStatusCaderno(item.statusNovo!)}`
    );
  }

  responsavelMovimentacaoCaderno(
    item: CadernoChoroHistorico
  ): string | null {
    if (item.tioCaronaNome) {
      return item.tioCaronaNome;
    }

    if (item.usuarioResponsavelNome) {
      return item.usuarioResponsavelNome;
    }

    return null;
  }

  private executarOperacaoLoteCaderno(): void {
    const selecionados =
      this.cadernosSelecionadosOperacaoLote();

    const dupla = this.duplaOperacaoLote();

    const tioCaronaEventoId =
      this.tioOperacaoLoteCadernoId();

    if (
      selecionados.length === 0 ||
      !dupla ||
      tioCaronaEventoId === null
    ) {
      this.toastWarn(
        'Os dados da operação não estão completos.'
      );
      return;
    }

    const request = {
      cadernoIds: selecionados.map(
        caderno => caderno.id
      ),
      tioCaronaEventoId,
      observacao:
        this.observacaoOperacaoLoteCaderno()
    };

    const requisicao = (() => {
      switch (this.tipoOperacaoLoteCaderno()) {
        case 'ENTREGA':
          return this.service
            .entregarCadernosSelecionadosADupla(
              this.eventoId,
              dupla.id,
              request
            );

        case 'RECEBIMENTO':
          return this.service
            .receberCadernosSelecionadosDaDupla(
              this.eventoId,
              dupla.id,
              request
            );

        case 'RECOLHIMENTO':
          return this.service
            .recolherCadernosCanceladosDaDupla(
              this.eventoId,
              dupla.id,
              request
            );
      }
    })();

    this.processandoCadernos.set(true);

    requisicao
      .pipe(
        finalize(() =>
          this.processandoCadernos.set(false)
        )
      )
      .subscribe({
        next: cadernosAtualizados => {
          this.atualizarCadernosNaLista(
            cadernosAtualizados
          );

          const mensagem =
            this.mensagemSucessoOperacaoLote(
              cadernosAtualizados.length
            );

          this.operacaoLoteCadernoVisivel.set(false);
          this.limparSelecaoCadernos();
          this.toastSuccess(mensagem);
        },
        error: erro => {
          console.error(
            'Erro na operação selecionada dos cadernos',
            erro
          );

          this.toastError(
            this.mensagemErro(
              erro,
              'Não foi possível concluir a operação dos cadernos.'
            )
          );
        }
      });
  }

  private mensagemSucessoOperacaoLote(
    quantidade: number
  ): string {
    switch (this.tipoOperacaoLoteCaderno()) {
      case 'ENTREGA':
        return `${quantidade} caderno(s) entregue(s) à dupla.`;

      case 'RECEBIMENTO':
        return `${quantidade} caderno(s) recebido(s) e direcionado(s) às equipes.`;

      case 'RECOLHIMENTO':
        return `${quantidade} caderno(s) cancelado(s) recolhido(s).`;
    }
  }
}
