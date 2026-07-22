import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ColorPickerModule } from 'primeng/colorpicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import {
  DuplaStatus,
  DuplaTioCarona,
  Evento,
  EquipeMontagemKit,
  Paroquia,
  Pessoa,
  Sobrinho,
  SobrinhoDupla,
  SobrinhoStatus,
  TioCaronaEvento,
  TioCaronaStatus,
  SubstituirDuplaVinculoRequest,
  VinculoStatus
} from '../../shared/models';
import { CustomFormHelperService } from '../../shared/services/custom-form-helper.service';
import { AuthService } from '../../core/auth/auth.service';
import { TelefoneMaskDirective } from '../../shared/directives/telefone-mask.directive';
import { EventoGestaoService } from './evento-gestao.service';

type AbaGestao = 'TIOS' | 'DUPLAS' | 'SOBRINHOS' | 'VINCULOS' | 'EQUIPES' | 'CADERNOS';

interface OpcaoNumerica {
  label: string;
  value: number;
  descricao?: string;
}

interface CorRapidaEquipe {
  label: string;
  valor: string;
}

@Component({
  selector: 'app-evento-gestao',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    ColorPickerModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    TableModule,
    TagModule,
    TextareaModule,
    TooltipModule,
    ToggleSwitchModule,
    TelefoneMaskDirective
  ],
  templateUrl: './evento-gestao.component.html',
  styleUrl: './evento-gestao.component.scss'
})
export class EventoGestaoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly seguranca = inject(AuthService);

  private readonly service = inject(EventoGestaoService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly customFormHelper = inject(CustomFormHelperService);

  readonly eventoId = Number(this.route.snapshot.paramMap.get('eventoId'));

  readonly coresRapidasEquipe: CorRapidaEquipe[] = [
    { label: 'Amarelo', valor: '#fbbf24' },
    { label: 'Vermelho', valor: '#ef4444' },
    { label: 'Azul', valor: '#3b82f6' },
    { label: 'Verde', valor: '#22c55e' },
    { label: 'Roxo', valor: '#8b5cf6' },
    { label: 'Laranja', valor: '#f97316' },
    { label: 'Rosa', valor: '#ec4899' },
    { label: 'Cinza', valor: '#64748b' }
  ];

  readonly evento = signal<Evento | null>(null);
  readonly paroquiasComunidades = signal<Paroquia[]>([]);
  readonly pessoas = signal<Pessoa[]>([]);
  readonly tiosCarona = signal<TioCaronaEvento[]>([]);
  readonly duplas = signal<DuplaTioCarona[]>([]);
  readonly sobrinhos = signal<Sobrinho[]>([]);
  readonly vinculos = signal<SobrinhoDupla[]>([]);
  readonly equipesMontagemKit = signal<EquipeMontagemKit[]>([]);

  readonly abaAtiva = signal<AbaGestao>('TIOS');
  readonly usarPessoaCadastradaEncontrista = signal(true);
  readonly carregando = signal(false);
  readonly salvandoTio = signal(false);
  readonly salvandoDupla = signal(false);
  readonly salvandoSobrinho = signal(false);
  readonly salvandoPessoaSobrinho = signal(false);
  readonly salvandoVinculo = signal(false);
  readonly salvandoEquipe = signal(false);
  readonly salvandoEdicaoEquipe = signal(false);
  readonly processandoTioId = signal<number | null>(null);
  readonly processandoDuplaId = signal<number | null>(null);
  readonly processandoVinculoId = signal<number | null>(null);
  readonly processandoEquipeId = signal<number | null>(null);

  readonly tioEdicaoVisivel = signal(false);
  readonly salvandoEdicaoTio = signal(false);
  readonly tioEmEdicao = signal<TioCaronaEvento | null>(null);

  readonly duplaEdicaoVisivel = signal(false);
  readonly salvandoEdicaoDupla = signal(false);
  readonly duplaEmEdicao = signal<DuplaTioCarona | null>(null);

  readonly sobrinhoEdicaoVisivel = signal(false);
  readonly salvandoEdicaoSobrinho = signal(false);
  readonly sobrinhoEmEdicao = signal<Sobrinho | null>(null);

  readonly pessoaDoEncontristaEmEdicao = computed(() => {
    const sobrinho = this.sobrinhoEmEdicao();

    if (!sobrinho?.pessoaId) {
      return null;
    }

    return this.pessoas().find(
      pessoa => pessoa.id === sobrinho.pessoaId
    ) ?? null;
  });

  readonly encontristaEmEdicaoVinculado = computed(
    () => Boolean(this.sobrinhoEmEdicao()?.pessoaId)
  );

  readonly vinculoTrocaDuplaVisivel = signal(false);
  readonly salvandoTrocaDupla = signal(false);
  readonly vinculoEmTroca = signal<SobrinhoDupla | null>(null);

  readonly modalSubstituirDuplaVisivel = signal(false);
  readonly vinculoEmSubstituicao = signal<SobrinhoDupla | null>(null);

  readonly equipeEdicaoVisivel = signal(false);
  readonly equipeEmEdicao = signal<EquipeMontagemKit | null>(null);
  readonly salvandoSubstituicaoDupla = signal(false);

  readonly tio1Selecionado = signal(0);
  readonly tio2Selecionado = signal(0);
  readonly filtroTios = signal('');
  readonly filtroDuplas = signal('');
  readonly filtroSobrinhos = signal('');
  readonly filtroVinculos = signal('');
  readonly filtroEquipes = signal('');

  readonly tioForm = this.fb.nonNullable.group({
    pessoaId: [0, [Validators.required, Validators.min(1)]],
    observacoes: ['', [Validators.maxLength(300)]]
  });

  readonly duplaForm = this.fb.nonNullable.group({
    tio1Id: [0, [Validators.required, Validators.min(1)]],
    tio2Id: [0, [Validators.required, Validators.min(1)]],
    paroquiaComunidadeId: [0, [Validators.required, Validators.min(1)]],
    apelido: ['', [Validators.maxLength(120)]]
  });

  readonly sobrinhoForm = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(150)]],
    telefone: ['', [Validators.maxLength(30)]],
    responsavelNome: ['', [Validators.required, Validators.maxLength(150)]],
    responsavelTelefone: ['', [Validators.required, Validators.maxLength(30)]],
    endereco: ['', [Validators.required, Validators.maxLength(180)]],
    dataNascimento: ['', [Validators.required]],
    restricaoAlimentar: ['', [Validators.maxLength(500)]],
    observacaoMedica: ['', [Validators.maxLength(500)]]
  });

  readonly pessoaSobrinhoForm = this.fb.nonNullable.group({
    pessoaId: [0, [Validators.required, Validators.min(1)]],
    telefone: ['', [Validators.maxLength(30)]],
    responsavelNome: ['', [Validators.required, Validators.maxLength(150)]],
    responsavelTelefone: ['', [Validators.required, Validators.maxLength(30)]],
    endereco: ['', [Validators.required, Validators.maxLength(180)]],
    dataNascimento: ['', [Validators.required]],
    restricaoAlimentar: ['', [Validators.maxLength(500)]],
    observacaoMedica: ['', [Validators.maxLength(500)]]
  });

  readonly vinculoForm = this.fb.nonNullable.group({
    sobrinhoId: [0, [Validators.required, Validators.min(1)]],
    duplaId: [0, [Validators.required, Validators.min(1)]]
  });

  readonly equipeForm = this.fb.nonNullable.group({
    apelido: ['', [Validators.required, Validators.maxLength(80)]],
    corIdentificacao: ['#fbbf24', [Validators.maxLength(30)]],
    integranteIds: [[] as number[]]
  });

  readonly tioEdicaoForm = this.fb.nonNullable.group({
    observacoes: ['', [Validators.maxLength(500)]]
  });

  readonly duplaEdicaoForm = this.fb.nonNullable.group({
    apelido: ['', [Validators.maxLength(120)]],
    paroquiaComunidadeId: [0, [Validators.required, Validators.min(1)]]
  });

  readonly sobrinhoEdicaoForm = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(150)]],
    telefone: ['', [Validators.maxLength(30)]],
    responsavelNome: ['', [Validators.required, Validators.maxLength(150)]],
    responsavelTelefone: ['', [Validators.required, Validators.maxLength(30)]],
    endereco: ['', [Validators.required, Validators.maxLength(180)]],
    dataNascimento: ['', [Validators.required]],
    restricaoAlimentar: ['', [Validators.maxLength(500)]],
    observacaoMedica: ['', [Validators.maxLength(500)]]
  });

  readonly equipeEdicaoForm = this.fb.nonNullable.group({
    apelido: ['', [Validators.required, Validators.maxLength(80)]],
    corIdentificacao: ['', [Validators.maxLength(30)]],
    integranteIds: [[] as number[]]
  });

  readonly vinculoTrocaDuplaForm = this.fb.nonNullable.group({
    duplaId: [0, [Validators.required, Validators.min(1)]]
  });

  readonly duplasAtivas = computed(() =>
    this.duplas().filter(dupla => dupla.status === 'ATIVA')
  );

  readonly duplasInativas = computed(() =>
    this.duplas().filter(dupla => dupla.status === 'INATIVA')
  );

  readonly vinculosAtivos = computed(() =>
    this.vinculos().filter(vinculo => vinculo.status === 'ATIVO')
  );

  readonly vinculosRemovidos = computed(() =>
    this.vinculos().filter(vinculo => vinculo.status === 'REMOVIDO')
  );

  readonly equipesMontagemKitAtivas = computed(() =>
    this.equipesMontagemKit().filter(equipe => equipe.status === 'ATIVA')
  );

  readonly equipesMontagemKitInativas = computed(() =>
    this.equipesMontagemKit().filter(equipe => equipe.status === 'INATIVA')
  );

  readonly opcoesPessoasTioCarona = computed<OpcaoNumerica[]>(() => {
    const pessoasJaAdicionadas = new Set(
      this.tiosCarona()
        .map(tio => tio.pessoaId)
    );

    return this.pessoas()
      .filter(pessoa => pessoa.ativo)
      .filter(pessoa => pessoa.tipo === 'TIO_CARONA')
      .filter(pessoa => !pessoasJaAdicionadas.has(pessoa.id))
      .map(pessoa => ({
        label: pessoa.nome,
        value: pessoa.id,
        descricao: pessoa.telefone || pessoa.email || 'Pessoa cadastrada como Tio Carona'
      }));
  });

  readonly idsTiosEmDuplasAtivas = computed<Set<number>>(() => {
    const ids = new Set<number>();

    this.duplas()
      .filter(dupla => dupla.status === 'ATIVA')
      .forEach(dupla => {
        ids.add(dupla.tio1Id);
        ids.add(dupla.tio2Id);
      });

    return ids;
  });

  readonly opcoesTiosEvento = computed<OpcaoNumerica[]>(() =>
    this.tiosCarona()
      .filter(tio => tio.status === 'ATIVO')
      .map(tio => ({
        label: tio.pessoaNome,
        value: tio.id
      }))
  );

  readonly opcoesParoquiasComunidades = computed<OpcaoNumerica[]>(() =>
    this.paroquiasComunidades()
      .map(paroquia => ({
        label: paroquia.nome,
        descricao: [paroquia.cidade, paroquia.uf].filter(Boolean).join(' / '),
        value: paroquia.id
      }))
  );

  readonly opcoesTiosDisponiveisParaDupla = computed<OpcaoNumerica[]>(() => {
    const idsJaUsados = this.idsTiosEmDuplasAtivas();

    return this.opcoesTiosEvento()
      .filter(opcao => !idsJaUsados.has(opcao.value));
  });

  readonly opcoesTio1Dupla = computed<OpcaoNumerica[]>(() => {
    const tio2Id = this.tio2Selecionado();

    return this.opcoesTiosDisponiveisParaDupla()
      .filter(opcao => opcao.value !== tio2Id);
  });

  readonly opcoesTio2Dupla = computed<OpcaoNumerica[]>(() => {
    const tio1Id = this.tio1Selecionado();

    return this.opcoesTiosDisponiveisParaDupla()
      .filter(opcao => opcao.value !== tio1Id);
  });

  readonly podeFormarNovaDupla = computed(() =>
    this.opcoesTiosDisponiveisParaDupla().length >= 2
  );

  readonly opcoesDuplas = computed<OpcaoNumerica[]>(() =>
    this.duplas()
      .filter(dupla => dupla.status === 'ATIVA')
      .map(dupla => ({
        label: dupla.apelido || dupla.codigo,
        descricao: `${dupla.tio1Nome} e ${dupla.tio2Nome} • ${dupla.paroquiaComunidadeNome || 'Sem paróquia/comunidade'}`,
        value: dupla.id
      }))
  );

  readonly opcoesDuplasParaTroca = computed<OpcaoNumerica[]>(() => {
    const vinculo = this.vinculoEmTroca();

    return this.duplas()
      .filter(dupla => dupla.status === 'ATIVA')
      .filter(dupla => dupla.id !== vinculo?.duplaId)
      .map(dupla => ({
        label: dupla.apelido || dupla.codigo,
        descricao: `${dupla.tio1Nome} e ${dupla.tio2Nome} • ${dupla.paroquiaComunidadeNome || 'Sem paróquia/comunidade'}`,
        value: dupla.id
      }));
  });

  readonly idsPessoasEncontristasJaAdicionadas = computed<Set<number>>(() => {
    const ids = new Set<number>();

    this.sobrinhos()
      .filter(sobrinho => !!sobrinho.pessoaId)
      .forEach(sobrinho => ids.add(Number(sobrinho.pessoaId)));

    return ids;
  });

  readonly opcoesPessoasEncontristas = computed<OpcaoNumerica[]>(() => {
    const idsJaAdicionados = this.idsPessoasEncontristasJaAdicionadas();

    return this.pessoas()
      .filter(pessoa => pessoa.ativo)
      .filter(pessoa => pessoa.tipo === 'SOBRINHO')
      .filter(pessoa => !idsJaAdicionados.has(pessoa.id))
      .map(pessoa => ({
        label: pessoa.nome,
        descricao: pessoa.telefone || pessoa.email || 'Pessoa cadastrada como Encontrista',
        value: pessoa.id
      }));
  });

  readonly pessoaEncontristaSelecionada = computed(() => {
    const pessoaId = Number(this.pessoaSobrinhoForm.controls.pessoaId.value ?? 0);

    if (pessoaId <= 0) {
      return null;
    }

    return this.pessoas().find(pessoa => pessoa.id === pessoaId) ?? null;
  });


  readonly idsPessoasEmEquipesDoKit = computed<Set<number>>(() => {
    const ids = new Set<number>();

    this.equipesMontagemKit()
      .forEach(equipe =>
        equipe.integrantes.forEach(integrante => ids.add(integrante.pessoaId))
      );

    return ids;
  });

  readonly opcoesPessoasEquipe = computed<OpcaoNumerica[]>(() => {
    const idsJaVinculados = this.idsPessoasEmEquipesDoKit();

    return this.pessoas()
      .filter(pessoa => pessoa.ativo)
      .filter(pessoa => pessoa.tipo === 'EQUIPE')
      .filter(pessoa => !idsJaVinculados.has(pessoa.id))
      .map(pessoa => ({
        label: pessoa.nome,
        descricao: pessoa.telefone || pessoa.email || 'Pessoa cadastrada como Equipe',
        value: pessoa.id
      }));
  });

  readonly opcoesPessoasEquipeEdicao = computed<OpcaoNumerica[]>(() => {
    const equipe = this.equipeEmEdicao();

    const idsDaEquipeAtual = new Set(
      equipe?.integrantes.map(integrante => integrante.pessoaId) ?? []
    );

    const idsJaVinculados = this.idsPessoasEmEquipesDoKit();

    return this.pessoas()
      .filter(pessoa => pessoa.tipo === 'EQUIPE')
      .filter(pessoa => pessoa.ativo || idsDaEquipeAtual.has(pessoa.id))
      .filter(pessoa =>
        idsDaEquipeAtual.has(pessoa.id) ||
        !idsJaVinculados.has(pessoa.id)
      )
      .map(pessoa => {
        const inativa = !pessoa.ativo;

        return {
          label: inativa
            ? `${pessoa.nome} — Inativa`
            : pessoa.nome,
          descricao: inativa
            ? 'Pessoa inativa já vinculada a esta equipe'
            : pessoa.telefone || pessoa.email || 'Pessoa cadastrada como Equipe',
          value: pessoa.id
        };
      });
  });


  readonly idsSobrinhosComVinculoAtivo = computed<Set<number>>(() => {
    const ids = new Set<number>();

    this.vinculos()
      .filter(vinculo => vinculo.status === 'ATIVO')
      .forEach(vinculo => ids.add(vinculo.sobrinhoId));

    return ids;
  });

  readonly opcoesSobrinhos = computed<OpcaoNumerica[]>(() => {
    const idsJaVinculados = this.idsSobrinhosComVinculoAtivo();

    return this.sobrinhos()
      .filter(sobrinho => sobrinho.status === 'INSCRITO' || sobrinho.status === 'PRESENTE')
      .filter(sobrinho => !idsJaVinculados.has(sobrinho.id))
      .map(sobrinho => ({
        label: sobrinho.nome,
        value: sobrinho.id
      }));
  });

  readonly tiosCaronaFiltrados = computed(() => {
    const filtro = this.normalizarFiltro(this.filtroTios());

    if (!filtro) {
      return this.tiosCarona();
    }

    return this.tiosCarona().filter(tio =>
      this.contemFiltro(tio.pessoaNome, filtro) ||
      this.contemFiltro(tio.status, filtro) ||
      this.contemFiltro(tio.observacoes, filtro)
    );
  });

  readonly duplasFiltradas = computed(() => {
    const filtro = this.normalizarFiltro(this.filtroDuplas());

    if (!filtro) {
      return this.duplas();
    }

    return this.duplas().filter(dupla =>
      this.contemFiltro(dupla.codigo, filtro) ||
      this.contemFiltro(dupla.apelido, filtro) ||
      this.contemFiltro(dupla.tio1Nome, filtro) ||
      this.contemFiltro(dupla.tio2Nome, filtro) ||
      this.contemFiltro(dupla.paroquiaComunidadeNome, filtro) ||
      this.contemFiltro(dupla.status, filtro)
    );
  });

  readonly sobrinhosFiltrados = computed(() => {
    const filtro = this.normalizarFiltro(this.filtroSobrinhos());

    if (!filtro) {
      return this.sobrinhos();
    }

    return this.sobrinhos().filter(sobrinho =>
      this.contemFiltro(sobrinho.nome, filtro) ||
      this.contemFiltro(sobrinho.responsavelNome, filtro) ||
      this.contemFiltro(sobrinho.telefone, filtro) ||
      this.contemFiltro(sobrinho.responsavelTelefone, filtro) ||
      this.contemFiltro(sobrinho.status, filtro)
    );
  });

  readonly vinculosFiltrados = computed(() => {
    const filtro = this.normalizarFiltro(this.filtroVinculos());

    if (!filtro) {
      return this.vinculos();
    }

    return this.vinculos().filter(vinculo =>
      this.contemFiltro(vinculo.sobrinhoNome, filtro) ||
      this.contemFiltro(vinculo.duplaCodigo, filtro) ||
      this.contemFiltro(this.labelDuplaVinculo(vinculo), filtro) ||
      this.contemFiltro(this.tooltipDuplaVinculo(vinculo), filtro) ||
      this.contemFiltro(vinculo.status, filtro)
    );
  });


  readonly equipesMontagemKitFiltradas = computed(() => {
    const filtro = this.normalizarFiltro(this.filtroEquipes());

    if (!filtro) {
      return this.equipesMontagemKit();
    }

    return this.equipesMontagemKit().filter(equipe =>
      this.contemFiltro(equipe.apelido, filtro) ||
      this.contemFiltro(equipe.corIdentificacao, filtro) ||
      this.contemFiltro(equipe.status, filtro) ||
      equipe.integrantes.some(integrante => this.contemFiltro(integrante.pessoaNome, filtro))
    );
  });


  readonly vinculoSubstituirDuplaForm = this.fb.nonNullable.group({
    novaDuplaId: [0, [Validators.required, Validators.min(1)]],
    motivo: ['', [Validators.required, Validators.maxLength(500)]],
    confirmarCadernoDevolvido: [false]
  });

  readonly opcoesDuplasParaSubstituicao = computed<OpcaoNumerica[]>(() => {
    const vinculo = this.vinculoEmSubstituicao();

    return this.duplas()
      .filter(dupla => dupla.status === 'ATIVA')
      .filter(dupla => !vinculo || dupla.id !== vinculo.duplaId)
      .map(dupla => ({
        label: dupla.apelido || dupla.codigo,
        descricao: `${dupla.tio1Nome} e ${dupla.tio2Nome} • ${dupla.paroquiaComunidadeNome || 'Sem paróquia/comunidade'}`,
        value: dupla.id
      }));
  });

  ngOnInit(): void {
    this.carregarTudo();
  }

  carregarTudo(): void {
    this.carregando.set(true);

    this.carregarEvento();
    this.carregarParoquiasComunidades();
    this.carregarPessoas();
    this.carregarTiosCarona();
    this.carregarDuplas();
    this.carregarSobrinhos();
    this.carregarVinculos();
    this.carregarEquipesMontagemKit();

    window.setTimeout(() => this.carregando.set(false), 600);
  }

  alterarAba(aba: AbaGestao): void {
    this.abaAtiva.set(aba);
  }

  alterarModoCadastroEncontrista(usarPessoaCadastrada: boolean): void {
    this.usarPessoaCadastradaEncontrista.set(usarPessoaCadastrada);

    if (usarPessoaCadastrada) {
      this.limparFormularioSobrinho();
      return;
    }

    this.limparFormularioPessoaSobrinho();
  }

  aoAlterarTio1(tioId: number | null): void {
    const id = Number(tioId ?? 0);
    this.tio1Selecionado.set(id);

    if (id > 0 && id === this.tio2Selecionado()) {
      this.tio2Selecionado.set(0);
      this.duplaForm.controls.tio2Id.setValue(0);
    }
  }

  aoAlterarTio2(tioId: number | null): void {
    const id = Number(tioId ?? 0);
    this.tio2Selecionado.set(id);

    if (id > 0 && id === this.tio1Selecionado()) {
      this.tio1Selecionado.set(0);
      this.duplaForm.controls.tio1Id.setValue(0);
    }
  }

  alterarFiltroTios(valor: string): void {
    this.filtroTios.set(valor);
  }

  alterarFiltroDuplas(valor: string): void {
    this.filtroDuplas.set(valor);
  }

  alterarFiltroSobrinhos(valor: string): void {
    this.filtroSobrinhos.set(valor);
  }

  alterarFiltroVinculos(valor: string): void {
    this.filtroVinculos.set(valor);
  }

  alterarFiltroEquipes(valor: string): void {
    this.filtroEquipes.set(valor);
  }

  formatarDupla(): void {
    this.customFormHelper.formatarCamposComTitleCase(this.duplaForm, ['apelido']);
  }

  formatarSobrinho(): void {
    this.customFormHelper.formatarCamposComTitleCase(this.sobrinhoForm, [
      'nome',
      'responsavelNome',
      'endereco'
    ]);
  }

  formatarPessoaSobrinho(): void {
    this.customFormHelper.formatarCamposComTitleCase(this.pessoaSobrinhoForm, [
      'responsavelNome',
      'endereco'
    ]);
  }

  formatarEquipe(): void {
    this.customFormHelper.formatarCamposComTitleCase(this.equipeForm, ['apelido']);
  }

  formatarEdicaoEquipe(): void {
    this.customFormHelper.formatarCamposComTitleCase(this.equipeEdicaoForm, ['apelido']);
  }

  aoAlterarPessoaSobrinho(pessoaId: number | null): void {
    const id = Number(pessoaId ?? 0);
    const pessoa = this.pessoas().find(item => item.id === id) ?? null;

    this.configurarCampoHerdado(
      this.pessoaSobrinhoForm.controls.telefone,
      TelefoneMaskDirective.formatar(pessoa?.telefone ?? ''),
      Boolean(pessoa?.telefone)
    );
    this.configurarCampoHerdado(
      this.pessoaSobrinhoForm.controls.dataNascimento,
      pessoa?.dataNascimento?.substring(0, 10) ?? '',
      Boolean(pessoa?.dataNascimento)
    );
    this.configurarCampoHerdado(
      this.pessoaSobrinhoForm.controls.responsavelNome,
      pessoa?.responsavelNome ?? '',
      Boolean(pessoa?.responsavelNome)
    );
    this.configurarCampoHerdado(
      this.pessoaSobrinhoForm.controls.responsavelTelefone,
      TelefoneMaskDirective.formatar(pessoa?.responsavelTelefone ?? ''),
      Boolean(pessoa?.responsavelTelefone)
    );
    this.configurarCampoHerdado(
      this.pessoaSobrinhoForm.controls.endereco,
      pessoa?.endereco ?? '',
      Boolean(pessoa?.endereco)
    );

    this.pessoaSobrinhoForm.markAsPristine();
    this.pessoaSobrinhoForm.markAsUntouched();
  }

  private configurarCampoHerdado(
    controle: FormControl<string>,
    valor: string,
    bloquear: boolean
  ): void {
    controle.setValue(valor, { emitEvent: false });

    if (bloquear) {
      controle.clearValidators();
      controle.disable({ emitEvent: false });
    } else {
      controle.enable({ emitEvent: false });
      controle.setValidators([Validators.required]);
    }

    controle.updateValueAndValidity({ emitEvent: false });
  }

  campoPessoaSobrinhoHerdado(
    campo: 'telefone' | 'dataNascimento' | 'responsavelNome' | 'responsavelTelefone' | 'endereco'
  ): boolean {
    const pessoa = this.pessoaEncontristaSelecionada();

    if (!pessoa) {
      return false;
    }

    return Boolean(pessoa[campo]);
  }

  pessoaSelecionadaPossuiDados(): boolean {
    return Boolean(this.pessoaEncontristaSelecionada());
  }

  formatarEdicaoDupla(): void {
    this.customFormHelper.formatarCamposComTitleCase(this.duplaEdicaoForm, ['apelido']);
  }

  formatarEdicaoSobrinho(): void {
    this.customFormHelper.formatarCamposComTitleCase(this.sobrinhoEdicaoForm, [
      'nome',
      'responsavelNome',
      'endereco'
    ]);
  }

  adicionarTioCarona(): void {
    if (this.tioForm.invalid) {
      this.tioForm.markAllAsTouched();
      this.toastWarn('Selecione a pessoa que será adicionada como tio carona.');
      return;
    }

    const valor = this.tioForm.getRawValue();

    this.salvandoTio.set(true);

    this.service.adicionarTioCarona(this.eventoId, {
      pessoaId: Number(valor.pessoaId),
      observacoes: this.normalizarTextoOpcional(valor.observacoes)
    }).subscribe({
      next: () => {
        this.toastSuccess('Tio carona adicionado ao evento com sucesso.');
        this.salvandoTio.set(false);
        this.limparFormularioTio();
        this.carregarTiosCarona();
      },
      error: erro => {
        console.error('Erro ao adicionar tio carona', {
          status: erro.status,
          url: erro.url,
          error: erro.error,
          message: erro.message
        });

        this.toastError('Não foi possível adicionar o tio carona ao evento. Confira se ele já não foi adicionado.');
        this.salvandoTio.set(false);
      }
    });
  }

  criarDupla(): void {
    if (!this.podeFormarNovaDupla()) {
      this.toastWarn('Não há tios carona disponíveis para formar uma nova dupla. Adicione novos tios ao evento ou revise as duplas já formadas.');
      return;
    }

    if (this.duplaForm.invalid) {
      this.duplaForm.markAllAsTouched();
      this.toastWarn('Selecione os dois tios carona e a paróquia/comunidade da dupla.');
      return;
    }

    this.formatarDupla();

    const valor = this.duplaForm.getRawValue();

    if (Number(valor.tio1Id) === Number(valor.tio2Id)) {
      this.toastWarn('A dupla deve ser formada por dois tios carona diferentes.');
      return;
    }

    this.salvandoDupla.set(true);

    this.service.criarDupla(this.eventoId, {
      tio1Id: Number(valor.tio1Id),
      tio2Id: Number(valor.tio2Id),
      paroquiaComunidadeId: Number(valor.paroquiaComunidadeId),
      apelido: this.normalizarTextoOpcional(valor.apelido)
    }).subscribe({
      next: () => {
        this.toastSuccess('Dupla criada com sucesso.');
        this.salvandoDupla.set(false);
        this.limparFormularioDupla();
        this.carregarDuplas();
        this.carregarVinculos();
        this.carregarEquipesMontagemKit();
      },
      error: erro => {
        console.error('Erro ao criar dupla', {
          status: erro.status,
          url: erro.url,
          error: erro.error,
          message: erro.message
        });

        this.toastError(this.mensagemErro(erro, 'Não foi possível criar a dupla. Confira se os tios já não estão em outra dupla ativa.'));
        this.salvandoDupla.set(false);
      }
    });
  }

  adicionarPessoaSobrinho(): void {
    if (this.opcoesPessoasEncontristas().length === 0) {
      this.toastWarn('Não há pessoas do tipo Encontrista disponíveis para adicionar ao evento.');
      return;
    }

    if (this.pessoaSobrinhoForm.invalid) {
      this.pessoaSobrinhoForm.markAllAsTouched();
      this.toastWarn(this.mensagemValidacaoPessoaSobrinho());
      return;
    }

    this.formatarPessoaSobrinho();

    const valor = this.pessoaSobrinhoForm.getRawValue();

    this.salvandoPessoaSobrinho.set(true);

    this.service.adicionarPessoaComoSobrinho(this.eventoId, {
      pessoaId: Number(valor.pessoaId),
      telefone: this.normalizarTextoOpcional(valor.telefone),
      responsavelNome: this.normalizarTextoOpcional(valor.responsavelNome),
      responsavelTelefone: this.normalizarTextoOpcional(valor.responsavelTelefone),
      endereco: this.normalizarTextoOpcional(valor.endereco),
      dataNascimento: this.normalizarTextoOpcional(valor.dataNascimento),
      restricaoAlimentar: this.normalizarTextoOpcional(valor.restricaoAlimentar),
      observacaoMedica: this.normalizarTextoOpcional(valor.observacaoMedica)
    }).subscribe({
      next: () => {
        this.toastSuccess('Pessoa adicionada como encontrista do evento com sucesso.');
        this.salvandoPessoaSobrinho.set(false);
        this.limparFormularioPessoaSobrinho();
        this.carregarSobrinhos();
      },
      error: erro => {
        console.error('Erro ao adicionar pessoa como encontrista', erro);
        this.toastError(this.mensagemErro(erro, 'Não foi possível adicionar a pessoa como encontrista do evento.'));
        this.salvandoPessoaSobrinho.set(false);
      }
    });
  }

  criarSobrinho(): void {
    if (this.sobrinhoForm.invalid) {
      this.sobrinhoForm.markAllAsTouched();
      this.toastWarn(this.mensagemValidacaoSobrinho());
      return;
    }

    this.formatarSobrinho();

    const valor = this.sobrinhoForm.getRawValue();

    this.salvandoSobrinho.set(true);

    this.service.criarSobrinho(this.eventoId, {
      nome: valor.nome.trim(),
      telefone: this.normalizarTextoOpcional(valor.telefone),
      responsavelNome: this.normalizarTextoOpcional(valor.responsavelNome),
      responsavelTelefone: this.normalizarTextoOpcional(valor.responsavelTelefone),
      endereco: this.normalizarTextoOpcional(valor.endereco),
      dataNascimento: this.normalizarTextoOpcional(valor.dataNascimento),
      restricaoAlimentar: this.normalizarTextoOpcional(valor.restricaoAlimentar),
      observacaoMedica: this.normalizarTextoOpcional(valor.observacaoMedica)
    }).subscribe({
      next: () => {
        this.toastSuccess('Encontrista cadastrado com sucesso.');
        this.salvandoSobrinho.set(false);
        this.limparFormularioSobrinho();
        this.carregarSobrinhos();
      },
      error: erro => {
        console.error('Erro ao cadastrar encontrista', erro);
        this.toastError(this.mensagemErro(erro, 'Não foi possível cadastrar o encontrista.'));
        this.salvandoSobrinho.set(false);
      }
    });
  }

  vincularSobrinho(): void {
    if (this.opcoesSobrinhos().length === 0) {
      this.toastWarn('Não há encontristas disponíveis para vínculo. Cadastre novos encontristas ou revise os vínculos existentes.');
      return;
    }

    if (this.opcoesDuplas().length === 0) {
      this.toastWarn('Não há duplas disponíveis para vínculo. Forme pelo menos uma dupla ativa antes de vincular encontristas.');
      return;
    }

    if (this.vinculoForm.invalid) {
      this.vinculoForm.markAllAsTouched();
      this.toastWarn('Selecione o encontrista e a dupla.');
      return;
    }

    const valor = this.vinculoForm.getRawValue();

    this.salvandoVinculo.set(true);

    this.service.vincularSobrinho(this.eventoId, {
      sobrinhoId: Number(valor.sobrinhoId),
      duplaId: Number(valor.duplaId)
    }).subscribe({
      next: () => {
        this.toastSuccess('Encontrista vinculado à dupla com sucesso.');
        this.salvandoVinculo.set(false);
        this.limparFormularioVinculo();
        this.carregarVinculos();
        this.carregarEquipesMontagemKit();
        this.carregarSobrinhos();
      },
      error: erro => {
        console.error('Erro ao vincular encontrista', erro);
        this.toastError(this.mensagemErro(erro, 'Não foi possível vincular o encontrista à dupla.'));
        this.salvandoVinculo.set(false);
      }
    });
  }

  excluirTioCarona(tio: TioCaronaEvento): void {
    if (!this.seguranca.podeEscrever()) {
      this.toastWarn('Você não tem permissão para remover tios carona do evento.');
      return;
    }

    this.confirmationService.confirm({
      header: 'Remover tio carona do evento?',
      message:
        `${tio.pessoaNome} deixará de participar como tio carona deste evento.<br><br>` +
        `O cadastro da pessoa não será excluído.<br>` +
        `A remoção será permitida somente se não existirem dupla, credencial ou operações associadas.`,
      icon: 'fa-solid fa-triangle-exclamation',
      acceptLabel: 'Remover do evento',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.processandoTioId.set(tio.id);

        this.service.excluirTioCarona(this.eventoId, tio.id)
          .pipe(
            finalize(() => this.processandoTioId.set(null))
          )
          .subscribe({
            next: () => {
              this.tiosCarona.update(tios =>
                tios.filter(item => item.id !== tio.id)
              );

              this.toastSuccess(
                `${tio.pessoaNome} foi removido deste evento com sucesso.`
              );

              /*
               * Recarregamos as duplas para manter todos os selects,
               * indicadores e dados derivados sincronizados.
               */
              this.carregarDuplas();
            },
            error: erro => {
              console.error('Erro ao remover tio carona do evento', erro);

              this.toastError(
                this.mensagemErro(
                  erro,
                  'Não foi possível remover o tio carona deste evento.'
                )
              );
            }
          });
      }
    });
  }

  excluirDupla(dupla: DuplaTioCarona): void {
    if (!this.seguranca.podeEscrever()) {
      this.toastWarn('Você não tem permissão para excluir duplas.');
      return;
    }

    this.confirmationService.confirm({
      header: 'Excluir dupla?',
      message:
        `A dupla ${this.nomeDupla(dupla)} será removida deste evento.<br><br> ` +
        `Os tios carona continuarão vinculados individualmente ao evento.<br> ` +
        `A exclusão será permitida somente se não existirem vínculos ` +
        `com encontristas ou histórico do Caderno de Mensagens.`,
      icon: 'fa-solid fa-triangle-exclamation',
      acceptLabel: 'Excluir dupla',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.processandoDuplaId.set(dupla.id);

        this.service.excluirDupla(this.eventoId, dupla.id)
          .pipe(
            finalize(() => this.processandoDuplaId.set(null))
          )
          .subscribe({
            next: () => {
              this.duplas.update(duplas =>
                duplas.filter(item => item.id !== dupla.id)
              );

              this.toastSuccess('Dupla excluída com sucesso.');

              /*
               * Os tios voltam a ficar disponíveis para formação
               * de novas duplas.
               */
              this.tio1Selecionado.set(0);
              this.tio2Selecionado.set(0);

              this.duplaForm.patchValue({
                tio1Id: 0,
                tio2Id: 0
              });

              this.carregarTiosCarona();
              this.carregarVinculos();
            },
            error: erro => {
              console.error('Erro ao excluir dupla', erro);

              this.toastError(
                this.mensagemErro(
                  erro,
                  'Não foi possível excluir a dupla.'
                )
              );
            }
          });
      }
    });
  }

  inativarDupla(dupla: DuplaTioCarona): void {
    this.confirmationService.confirm({
      header: 'Inativar dupla',
      message: `Deseja realmente inativar a dupla ${this.nomeDupla(dupla)}?`,
      icon: 'fa-solid fa-triangle-exclamation',
      acceptLabel: 'Inativar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.processandoDuplaId.set(dupla.id);

        this.service.inativarDupla(this.eventoId, dupla.id)
          .pipe(finalize(() => this.processandoDuplaId.set(null)))
          .subscribe({
            next: duplaAtualizada => {
              this.atualizarDuplaNaLista(duplaAtualizada);
              this.toastSuccess('Dupla inativada com sucesso.');
            },
            error: erro => {
              console.error('Erro ao inativar dupla', erro);
              this.toastError(this.mensagemErro(erro, 'Não foi possível inativar a dupla.'));
            }
          });
      }
    });
  }

  reativarDupla(dupla: DuplaTioCarona): void {
    this.confirmationService.confirm({
      header: 'Reativar dupla',
      message: `Deseja realmente reativar a dupla ${this.nomeDupla(dupla)}?`,
      icon: 'fa-solid fa-circle-question',
      acceptLabel: 'Reativar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.processandoDuplaId.set(dupla.id);

        this.service.reativarDupla(this.eventoId, dupla.id)
          .pipe(finalize(() => this.processandoDuplaId.set(null)))
          .subscribe({
            next: duplaAtualizada => {
              this.atualizarDuplaNaLista(duplaAtualizada);
              this.toastSuccess('Dupla reativada com sucesso.');
            },
            error: erro => {
              console.error('Erro ao reativar dupla', erro);
              this.toastError(this.mensagemErro(erro, 'Não foi possível reativar a dupla.'));
            }
          });
      }
    });
  }

  removerVinculo(vinculo: SobrinhoDupla): void {
    this.confirmationService.confirm({
      header: 'Remover vínculo',
      message: `Deseja realmente remover o vínculo de ${vinculo.sobrinhoNome} com a dupla ${this.nomeDuplaVinculo(vinculo)}?`,
      icon: 'fa-solid fa-triangle-exclamation',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.processandoVinculoId.set(vinculo.id);

        this.service.removerVinculo(this.eventoId, vinculo.id)
          .pipe(finalize(() => this.processandoVinculoId.set(null)))
          .subscribe({
            next: vinculoAtualizado => {
              this.atualizarVinculoNaLista(vinculoAtualizado);
              this.toastSuccess('Vínculo removido com sucesso.');
              this.carregarSobrinhos();
            },
            error: erro => {
              console.error('Erro ao remover vínculo', erro);
              this.toastError(this.mensagemErro(erro, 'Não foi possível remover o vínculo.'));
            }
          });
      }
    });
  }

  reativarVinculo(vinculo: SobrinhoDupla): void {
    this.confirmationService.confirm({
      header: 'Reativar vínculo',
      message: `Deseja realmente reativar o vínculo de ${vinculo.sobrinhoNome} com a dupla ${this.nomeDuplaVinculo(vinculo)}?`,
      icon: 'fa-solid fa-circle-question',
      acceptLabel: 'Reativar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.processandoVinculoId.set(vinculo.id);

        this.service.reativarVinculo(this.eventoId, vinculo.id)
          .pipe(finalize(() => this.processandoVinculoId.set(null)))
          .subscribe({
            next: vinculoAtualizado => {
              this.atualizarVinculoNaLista(vinculoAtualizado);
              this.toastSuccess('Vínculo reativado com sucesso.');
              this.carregarSobrinhos();
            },
            error: erro => {
              console.error('Erro ao reativar vínculo', erro);
              this.toastError(this.mensagemErro(erro, 'Não foi possível reativar o vínculo.'));
            }
          });
      }
    });
  }

  nomeDupla(dupla: DuplaTioCarona): string {
    if (dupla.apelido?.trim()) {
      return dupla.apelido.trim();
    }

    return `${dupla.codigo} - ${dupla.tio1Nome} e ${dupla.tio2Nome}`;
  }

  nomeDuplaVinculo(vinculo: SobrinhoDupla): string {
    const dupla = this.duplaDoVinculo(vinculo);

    if (dupla?.apelido?.trim()) {
      return dupla.apelido.trim();
    }

    if (dupla?.codigo?.trim()) {
      return dupla.codigo.trim();
    }

    if (vinculo.duplaCodigo?.trim()) {
      return vinculo.duplaCodigo.trim();
    }

    return `Dupla #${vinculo.duplaId}`;
  }


  abrirEdicaoTio(tio: TioCaronaEvento): void {
    this.tioEmEdicao.set(tio);
    this.tioEdicaoForm.reset({
      observacoes: tio.observacoes ?? ''
    });
    this.tioEdicaoVisivel.set(true);
  }

  fecharEdicaoTio(): void {
    this.tioEdicaoVisivel.set(false);
    this.tioEmEdicao.set(null);
    this.tioEdicaoForm.reset({ observacoes: '' });
  }

  salvarEdicaoTio(): void {
    const tio = this.tioEmEdicao();

    if (!tio) {
      return;
    }

    if (this.tioEdicaoForm.invalid) {
      this.tioEdicaoForm.markAllAsTouched();
      this.toastWarn('Revise as observações antes de salvar.');
      return;
    }

    const valor = this.tioEdicaoForm.getRawValue();

    this.salvandoEdicaoTio.set(true);

    this.service.atualizarTioCarona(this.eventoId, tio.id, {
      observacoes: this.normalizarTextoOpcional(valor.observacoes)
    }).pipe(finalize(() => this.salvandoEdicaoTio.set(false)))
      .subscribe({
        next: tioAtualizado => {
          this.atualizarTioNaLista(tioAtualizado);
          this.toastSuccess('Tio carona atualizado com sucesso.');
          this.fecharEdicaoTio();
        },
        error: erro => {
          console.error('Erro ao atualizar tio carona', erro);
          this.toastError(this.mensagemErro(erro, 'Não foi possível atualizar o tio carona.'));
        }
      });
  }

  abrirEdicaoDupla(dupla: DuplaTioCarona): void {
    this.duplaEmEdicao.set(dupla);
    this.duplaEdicaoForm.reset({
      apelido: dupla.apelido ?? '',
      paroquiaComunidadeId: dupla.paroquiaComunidadeId ?? this.evento()?.paroquiaId ?? 0
    });
    this.duplaEdicaoVisivel.set(true);
  }

  fecharEdicaoDupla(): void {
    this.duplaEdicaoVisivel.set(false);
    this.duplaEmEdicao.set(null);
    this.duplaEdicaoForm.reset({ apelido: '', paroquiaComunidadeId: 0 });
  }

  salvarEdicaoDupla(): void {
    const dupla = this.duplaEmEdicao();

    if (!dupla) {
      return;
    }

    if (this.duplaEdicaoForm.invalid) {
      this.duplaEdicaoForm.markAllAsTouched();
      this.toastWarn('Revise o apelido e a paróquia/comunidade da dupla antes de salvar.');
      return;
    }

    this.formatarEdicaoDupla();

    const valor = this.duplaEdicaoForm.getRawValue();

    this.salvandoEdicaoDupla.set(true);

    this.service.atualizarDupla(this.eventoId, dupla.id, {
      apelido: this.normalizarTextoOpcional(valor.apelido),
      paroquiaComunidadeId: Number(valor.paroquiaComunidadeId)
    }).pipe(finalize(() => this.salvandoEdicaoDupla.set(false)))
      .subscribe({
        next: duplaAtualizada => {
          this.atualizarDuplaNaLista(duplaAtualizada);
          this.toastSuccess('Dupla atualizada com sucesso.');
          this.fecharEdicaoDupla();
        },
        error: erro => {
          console.error('Erro ao atualizar dupla', erro);
          this.toastError(this.mensagemErro(erro, 'Não foi possível atualizar a dupla.'));
        }
      });
  }

  abrirEdicaoSobrinho(sobrinho: Sobrinho): void {
    this.sobrinhoEmEdicao.set(sobrinho);
    this.sobrinhoEdicaoForm.reset({
      nome: sobrinho.nome ?? '',
      telefone: TelefoneMaskDirective.formatar(sobrinho.telefone ?? ''),
      responsavelNome: sobrinho.responsavelNome ?? '',
      responsavelTelefone: TelefoneMaskDirective.formatar(sobrinho.responsavelTelefone ?? ''),
      endereco: sobrinho.endereco ?? '',
      dataNascimento: sobrinho.dataNascimento?.substring(0, 10) ?? '',
      restricaoAlimentar: sobrinho.restricaoAlimentar ?? '',
      observacaoMedica: sobrinho.observacaoMedica ?? ''
    });
    this.configurarEdicaoEncontristaVinculado(sobrinho);
    this.sobrinhoEdicaoVisivel.set(true);
  }
  private configurarEdicaoEncontristaVinculado(
    sobrinho: Sobrinho
  ): void {
    const pessoa = sobrinho.pessoaId
      ? this.pessoas().find(item => item.id === sobrinho.pessoaId) ?? null
      : null;

    const campos = [
      {
        controle: this.sobrinhoEdicaoForm.controls.nome,
        bloquear: Boolean(pessoa?.nome)
      },
      {
        controle: this.sobrinhoEdicaoForm.controls.telefone,
        bloquear: Boolean(pessoa?.telefone)
      },
      {
        controle: this.sobrinhoEdicaoForm.controls.responsavelNome,
        bloquear: Boolean(pessoa?.responsavelNome)
      },
      {
        controle: this.sobrinhoEdicaoForm.controls.responsavelTelefone,
        bloquear: Boolean(pessoa?.responsavelTelefone)
      },
      {
        controle: this.sobrinhoEdicaoForm.controls.endereco,
        bloquear: Boolean(pessoa?.endereco)
      },
      {
        controle: this.sobrinhoEdicaoForm.controls.dataNascimento,
        bloquear: Boolean(pessoa?.dataNascimento)
      }
    ];

    for (const campo of campos) {
      if (pessoa && campo.bloquear) {
        campo.controle.disable({ emitEvent: false });
      } else {
        campo.controle.enable({ emitEvent: false });
      }

      campo.controle.updateValueAndValidity({ emitEvent: false });
    }
  }

  campoEdicaoHerdado(
    campo: 'nome' | 'telefone' | 'responsavelNome' | 'responsavelTelefone' | 'endereco' | 'dataNascimento'
  ): boolean {
    const pessoa = this.pessoaDoEncontristaEmEdicao();
    return Boolean(pessoa?.[campo]);
  }

  fecharEdicaoSobrinho(): void {
    this.sobrinhoEdicaoVisivel.set(false);
    this.sobrinhoEmEdicao.set(null);
    for (const controle of Object.values(this.sobrinhoEdicaoForm.controls)) {
      controle.enable({ emitEvent: false });
    }

    this.sobrinhoEdicaoForm.reset({
      nome: '',
      telefone: '',
      responsavelNome: '',
      responsavelTelefone: '',
      endereco: '',
      dataNascimento: '',
      restricaoAlimentar: '',
      observacaoMedica: ''
    });
  }

  salvarEdicaoSobrinho(): void {
    const sobrinho = this.sobrinhoEmEdicao();

    if (!sobrinho) {
      return;
    }

    if (this.sobrinhoEdicaoForm.invalid) {
      this.sobrinhoEdicaoForm.markAllAsTouched();
      this.toastWarn(this.mensagemValidacaoEdicaoSobrinho());
      return;
    }

    this.formatarEdicaoSobrinho();

    const valor = this.sobrinhoEdicaoForm.getRawValue();

    this.salvandoEdicaoSobrinho.set(true);

    this.service.atualizarSobrinho(this.eventoId, sobrinho.id, {
      nome: valor.nome.trim(),
      telefone: this.normalizarTextoOpcional(valor.telefone),
      responsavelNome: this.normalizarTextoOpcional(valor.responsavelNome),
      responsavelTelefone: this.normalizarTextoOpcional(valor.responsavelTelefone),
      endereco: this.normalizarTextoOpcional(valor.endereco),
      dataNascimento: this.normalizarTextoOpcional(valor.dataNascimento),
      restricaoAlimentar: this.normalizarTextoOpcional(valor.restricaoAlimentar),
      observacaoMedica: this.normalizarTextoOpcional(valor.observacaoMedica)
    }).pipe(finalize(() => this.salvandoEdicaoSobrinho.set(false)))
      .subscribe({
        next: sobrinhoAtualizado => {
          this.atualizarSobrinhoNaLista(sobrinhoAtualizado);
          this.toastSuccess('Encontrista atualizado com sucesso.');
          this.fecharEdicaoSobrinho();
          this.carregarVinculos();
          this.carregarEquipesMontagemKit();
        },
        error: erro => {
          console.error('Erro ao atualizar encontrista', erro);
          this.toastError(this.mensagemErro(erro, 'Não foi possível atualizar o encontrista.'));
        }
      });
  }

  abrirTrocaDuplaVinculo(vinculo: SobrinhoDupla): void {
    this.vinculoEmTroca.set(vinculo);
    this.vinculoTrocaDuplaForm.reset({ duplaId: 0 });
    this.vinculoTrocaDuplaVisivel.set(true);
  }

  fecharTrocaDuplaVinculo(): void {
    this.vinculoTrocaDuplaVisivel.set(false);
    this.vinculoEmTroca.set(null);
    this.vinculoTrocaDuplaForm.reset({ duplaId: 0 });
  }

  salvarTrocaDuplaVinculo(): void {
    const vinculo = this.vinculoEmTroca();

    if (!vinculo) {
      return;
    }

    if (this.vinculoTrocaDuplaForm.invalid) {
      this.vinculoTrocaDuplaForm.markAllAsTouched();
      this.toastWarn('Selecione a nova dupla do vínculo.');
      return;
    }

    const valor = this.vinculoTrocaDuplaForm.getRawValue();

    this.salvandoTrocaDupla.set(true);

    this.service.trocarDuplaVinculo(this.eventoId, vinculo.id, {
      duplaId: Number(valor.duplaId)
    }).pipe(finalize(() => this.salvandoTrocaDupla.set(false)))
      .subscribe({
        next: vinculoAtualizado => {
          this.atualizarVinculoNaLista(vinculoAtualizado);
          this.toastSuccess('Dupla do vínculo atualizada com sucesso.');
          this.fecharTrocaDuplaVinculo();
        },
        error: erro => {
          console.error('Erro ao trocar dupla do vínculo', erro);
          this.toastError(this.mensagemErro(erro, 'Não foi possível trocar a dupla do vínculo.'));
        }
      });
  }

  abrirModalSubstituirDupla(vinculo: SobrinhoDupla): void {
    if (vinculo.status !== 'ATIVO') {
      this.toastWarn('Somente vínculos ativos podem substituir a dupla responsável.');
      return;
    }

    this.vinculoEmSubstituicao.set(vinculo);

    this.vinculoSubstituirDuplaForm.reset({
      novaDuplaId: 0,
      motivo: '',
      confirmarCadernoDevolvido: false
    });

    this.vinculoSubstituirDuplaForm.markAsPristine();
    this.vinculoSubstituirDuplaForm.markAsUntouched();
    this.vinculoSubstituirDuplaForm.updateValueAndValidity();

    this.modalSubstituirDuplaVisivel.set(true);
  }

  fecharModalSubstituirDupla(forcar = false): void {
    if (this.salvandoSubstituicaoDupla() && !forcar) {
      return;
    }

    this.modalSubstituirDuplaVisivel.set(false);
    this.vinculoEmSubstituicao.set(null);

    this.vinculoSubstituirDuplaForm.reset({
      novaDuplaId: 0,
      motivo: '',
      confirmarCadernoDevolvido: false
    });

    this.vinculoSubstituirDuplaForm.markAsPristine();
    this.vinculoSubstituirDuplaForm.markAsUntouched();
    this.vinculoSubstituirDuplaForm.updateValueAndValidity();
  }

  salvarSubstituicaoDupla(): void {
    const vinculo = this.vinculoEmSubstituicao();

    if (!vinculo) {
      this.toastWarn('Nenhum vínculo selecionado para substituição.');
      return;
    }

    if (this.vinculoSubstituirDuplaForm.invalid) {
      this.vinculoSubstituirDuplaForm.markAllAsTouched();
      this.toastWarn('Informe a nova dupla e o motivo da substituição.');
      return;
    }

    const valor = this.vinculoSubstituirDuplaForm.getRawValue();

    const payload: SubstituirDuplaVinculoRequest = {
      novaDuplaId: Number(valor.novaDuplaId),
      motivo: valor.motivo.trim(),
      confirmarCadernoDevolvido: Boolean(valor.confirmarCadernoDevolvido)
    };

    this.salvandoSubstituicaoDupla.set(true);

    this.service.substituirDuplaVinculo(this.eventoId, vinculo.id, payload)
      .pipe(finalize(() => this.salvandoSubstituicaoDupla.set(false)))
      .subscribe({
        next: vinculoAtualizado => {
          this.atualizarVinculoNaLista(vinculoAtualizado);
          this.toastSuccess('Dupla responsável substituída com sucesso.');
          this.fecharModalSubstituirDupla(true);
          this.carregarVinculos();
          this.carregarEquipesMontagemKit();
        },
        error: erro => {
          console.error('Erro ao substituir dupla responsável', erro);
          this.toastError(this.mensagemErro(erro, 'Não foi possível substituir a dupla responsável.'));
        }
      });
  }

  labelStatusTio(status: TioCaronaStatus): string {
    return status === 'ATIVO' ? 'Ativo' : 'Inativo';
  }

  severityStatusTio(status: TioCaronaStatus): 'success' | 'secondary' {
    return status === 'ATIVO' ? 'success' : 'secondary';
  }

  labelStatusDupla(status: DuplaStatus): string {
    return status === 'ATIVA' ? 'Ativa' : 'Inativa';
  }

  severityStatusDupla(status: DuplaStatus): 'success' | 'secondary' {
    return status === 'ATIVA' ? 'success' : 'secondary';
  }

  labelStatusSobrinho(status: SobrinhoStatus): string {
    switch (status) {
      case 'INSCRITO':
        return 'Inscrito';
      case 'PRESENTE':
        return 'Presente';
      case 'AUSENTE':
        return 'Ausente';
      case 'DESISTENTE':
        return 'Desistente';
    }
  }

  severityStatusSobrinho(status: SobrinhoStatus): 'info' | 'success' | 'warn' | 'danger' {
    switch (status) {
      case 'INSCRITO':
        return 'info';
      case 'PRESENTE':
        return 'success';
      case 'AUSENTE':
        return 'warn';
      case 'DESISTENTE':
        return 'danger';
    }
  }

  labelStatusVinculo(status: VinculoStatus): string {
    return status === 'ATIVO' ? 'Ativo' : 'Removido';
  }

  severityStatusVinculo(status: VinculoStatus): 'success' | 'secondary' {
    return status === 'ATIVO' ? 'success' : 'secondary';
  }

  private atualizarTioNaLista(tioAtualizado: TioCaronaEvento): void {
    this.tiosCarona.update(tios =>
      tios.map(tio => tio.id === tioAtualizado.id ? tioAtualizado : tio)
    );
  }

  private atualizarDuplaNaLista(duplaAtualizada: DuplaTioCarona): void {
    this.duplas.update(duplas =>
      duplas.map(dupla => dupla.id === duplaAtualizada.id ? duplaAtualizada : dupla)
    );
  }

  private atualizarSobrinhoNaLista(sobrinhoAtualizado: Sobrinho): void {
    this.sobrinhos.update(sobrinhos =>
      sobrinhos.map(sobrinho => sobrinho.id === sobrinhoAtualizado.id ? sobrinhoAtualizado : sobrinho)
    );
  }

  private atualizarVinculoNaLista(vinculoAtualizado: SobrinhoDupla): void {
    this.vinculos.update(vinculos =>
      vinculos.map(vinculo => vinculo.id === vinculoAtualizado.id ? vinculoAtualizado : vinculo)
    );
  }

  private atualizarEquipeNaLista(equipeAtualizada: EquipeMontagemKit): void {
    this.equipesMontagemKit.update(equipes =>
      equipes.map(equipe => equipe.id === equipeAtualizada.id ? equipeAtualizada : equipe)
    );
  }


  selecionarCorEquipe(cor: string): void {
    this.equipeForm.controls.corIdentificacao.setValue(cor);
    this.equipeForm.controls.corIdentificacao.markAsDirty();
    this.equipeForm.controls.corIdentificacao.updateValueAndValidity();
  }

  selecionarCorEdicaoEquipe(cor: string): void {
    this.equipeEdicaoForm.controls.corIdentificacao.setValue(cor);
    this.equipeEdicaoForm.controls.corIdentificacao.markAsDirty();
    this.equipeEdicaoForm.controls.corIdentificacao.updateValueAndValidity();
  }

  corEquipeFormulario(): string {
    return this.normalizarCorVisual(this.equipeForm.controls.corIdentificacao.value);
  }

  corEdicaoEquipeFormulario(): string {
    return this.normalizarCorVisual(this.equipeEdicaoForm.controls.corIdentificacao.value);
  }

  corRapidaSelecionada(corAtual: string | null | undefined, corRapida: string): boolean {
    return this.normalizarCorVisual(corAtual).toLowerCase() === corRapida.toLowerCase();
  }

  private normalizarCorVisual(cor: string | null | undefined): string {
    const corTratada = this.normalizarCorParaPayload(cor);

    return corTratada ?? '#64748b';
  }

  private normalizarCorParaPayload(cor: string | null | undefined): string | undefined {
    if (!cor || !cor.trim()) {
      return undefined;
    }

    const valor = cor.trim();

    if (valor.startsWith('#')) {
      return valor;
    }

    if (/^[0-9a-fA-F]{6}$/.test(valor)) {
      return `#${valor}`;
    }

    return valor;
  }

  adicionarEquipeMontagemKit(): void {
    if (this.equipeForm.invalid) {
      this.equipeForm.markAllAsTouched();
      this.toastWarn('Informe o apelido da equipe de montagem do kit.');
      return;
    }

    this.formatarEquipe();

    const valor = this.equipeForm.getRawValue();

    if (this.possuiIntegranteEmOutraEquipe(valor.integranteIds)) {
      this.toastWarn('Uma pessoa só pode participar de uma equipe do kit por evento.');
      return;
    }

    this.salvandoEquipe.set(true);

    this.service.criarEquipeMontagemKit(this.eventoId, {
      apelido: valor.apelido,
      corIdentificacao: this.normalizarCorParaPayload(valor.corIdentificacao),
      integranteIds: valor.integranteIds
    }).pipe(finalize(() => this.salvandoEquipe.set(false)))
      .subscribe({
        next: equipe => {
          this.equipesMontagemKit.update(equipes => [...equipes, equipe]);
          this.limparFormularioEquipe();
          this.toastSuccess('Equipe de montagem do kit criada com sucesso.');
        },
        error: erro => {
          console.error('Erro ao criar equipe de montagem do kit', erro);
          this.toastError(this.mensagemErro(erro, 'Não foi possível criar a equipe de montagem do kit.'));
        }
      });
  }

  limparFormularioEquipe(): void {
    this.equipeForm.reset({
      apelido: '',
      corIdentificacao: '#fbbf24',
      integranteIds: []
    });
  }

  abrirEdicaoEquipe(equipe: EquipeMontagemKit): void {
    this.equipeEmEdicao.set(equipe);
    this.equipeEdicaoForm.reset({
      apelido: equipe.apelido,
      corIdentificacao: equipe.corIdentificacao ?? '',
      integranteIds: equipe.integrantes.map(integrante => integrante.pessoaId)
    });
    this.equipeEdicaoVisivel.set(true);
  }

  fecharEdicaoEquipe(): void {
    this.equipeEdicaoVisivel.set(false);
    this.equipeEmEdicao.set(null);
    this.equipeEdicaoForm.reset({
      apelido: '',
      corIdentificacao: '',
      integranteIds: []
    });
  }

  salvarEdicaoEquipe(): void {
    const equipe = this.equipeEmEdicao();

    if (!equipe) {
      return;
    }

    if (this.equipeEdicaoForm.invalid) {
      this.equipeEdicaoForm.markAllAsTouched();
      this.toastWarn('Informe o apelido da equipe de montagem do kit.');
      return;
    }

    this.formatarEdicaoEquipe();

    const valor = this.equipeEdicaoForm.getRawValue();

    if (this.possuiIntegranteEmOutraEquipe(valor.integranteIds, equipe.id)) {
      this.toastWarn('Uma pessoa só pode participar de uma equipe do kit por evento.');
      return;
    }

    this.salvandoEdicaoEquipe.set(true);

    this.service.atualizarEquipeMontagemKit(this.eventoId, equipe.id, {
      apelido: valor.apelido,
      corIdentificacao: this.normalizarCorParaPayload(valor.corIdentificacao),
      integranteIds: valor.integranteIds
    }).pipe(finalize(() => this.salvandoEdicaoEquipe.set(false)))
      .subscribe({
        next: equipeAtualizada => {
          this.atualizarEquipeNaLista(equipeAtualizada);
          this.fecharEdicaoEquipe();
          this.toastSuccess('Equipe de montagem do kit atualizada com sucesso.');
        },
        error: erro => {
          console.error('Erro ao atualizar equipe de montagem do kit', erro);
          this.toastError(this.mensagemErro(erro, 'Não foi possível atualizar a equipe de montagem do kit.'));
        }
      });
  }

  inativarEquipeMontagemKit(equipe: EquipeMontagemKit): void {
    this.processandoEquipeId.set(equipe.id);

    this.service.inativarEquipeMontagemKit(this.eventoId, equipe.id)
      .pipe(finalize(() => this.processandoEquipeId.set(null)))
      .subscribe({
        next: equipeAtualizada => {
          this.atualizarEquipeNaLista(equipeAtualizada);
          this.toastSuccess('Equipe de montagem do kit inativada.');
        },
        error: erro => {
          console.error('Erro ao inativar equipe de montagem do kit', erro);
          this.toastError(this.mensagemErro(erro, 'Não foi possível inativar a equipe.'));
        }
      });
  }

  reativarEquipeMontagemKit(equipe: EquipeMontagemKit): void {
    this.processandoEquipeId.set(equipe.id);

    this.service.reativarEquipeMontagemKit(this.eventoId, equipe.id)
      .pipe(finalize(() => this.processandoEquipeId.set(null)))
      .subscribe({
        next: equipeAtualizada => {
          this.atualizarEquipeNaLista(equipeAtualizada);
          this.toastSuccess('Equipe de montagem do kit reativada.');
        },
        error: erro => {
          console.error('Erro ao reativar equipe de montagem do kit', erro);
          this.toastError(this.mensagemErro(erro, 'Não foi possível reativar a equipe.'));
        }
      });
  }

  labelStatusEquipeMontagemKit(status: string): string {
    switch (status) {
      case 'ATIVA':
        return 'Ativa';
      case 'INATIVA':
        return 'Inativa';
      default:
        return status;
    }
  }

  severityStatusEquipeMontagemKit(status: string): 'info' | 'success' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'ATIVA':
        return 'success';
      case 'INATIVA':
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  private carregarEvento(): void {
    this.service.buscarEvento(this.eventoId).subscribe({
      next: evento => {
        this.evento.set(evento);

        if (!this.duplaForm.controls.paroquiaComunidadeId.value && evento.paroquiaId) {
          this.duplaForm.controls.paroquiaComunidadeId.setValue(evento.paroquiaId);
        }
      },
      error: erro => {
        console.error('Erro ao carregar evento', erro);
        this.toastError('Não foi possível carregar os dados do evento.');
      }
    });
  }

  private carregarParoquiasComunidades(): void {
    this.service.listarParoquiasComunidades().subscribe({
      next: paroquias => {
        this.paroquiasComunidades.set(paroquias);

        const eventoParoquiaId = this.evento()?.paroquiaId ?? 0;
        const valorAtual = this.duplaForm.controls.paroquiaComunidadeId.value;

        if (!valorAtual && eventoParoquiaId > 0) {
          this.duplaForm.controls.paroquiaComunidadeId.setValue(eventoParoquiaId);
        }
      },
      error: erro => {
        console.error('Erro ao carregar paróquia/comunidades/comunidades/comunidades', erro);
        this.toastError('Não foi possível carregar as paróquia/comunidades/comunidades/comunidades.');
      }
    });
  }

  private carregarPessoas(): void {
    this.service.listarPessoas().subscribe({
      next: pessoas => this.pessoas.set(pessoas),
      error: erro => {
        console.error('Erro ao carregar pessoas', erro);
        this.toastError('Não foi possível carregar as pessoas.');
      }
    });
  }

  private carregarTiosCarona(): void {
    this.service.listarTiosCarona(this.eventoId).subscribe({
      next: tios => this.tiosCarona.set(tios),
      error: erro => {
        console.error('Erro ao carregar tios carona', erro);
        this.toastError('Não foi possível carregar os tios carona do evento.');
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
        console.error('Erro ao carregar encontristas', erro);
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

  private carregarEquipesMontagemKit(): void {
    this.service.listarEquipesMontagemKit(this.eventoId).subscribe({
      next: equipes => this.equipesMontagemKit.set(equipes),
      error: erro => {
        console.error('Erro ao carregar equipes de montagem do kit', erro);
        this.toastError('Não foi possível carregar as equipes de montagem do kit.');
      }
    });
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
      life: 4500
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

  private normalizarTextoOpcional(valor: string): string | undefined {
    const texto = valor?.trim();
    return texto ? texto : undefined;
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

  private mensagemValidacaoPessoaSobrinho(): string {
    const campos: string[] = [];

    if (this.pessoaSobrinhoForm.controls.pessoaId.hasError('required') ||
      this.pessoaSobrinhoForm.controls.pessoaId.hasError('min')) {
      campos.push('pessoa encontrista');
    }

    if (this.pessoaSobrinhoForm.controls.responsavelNome.hasError('required')) {
      campos.push('nome do responsável');
    }

    if (this.pessoaSobrinhoForm.controls.responsavelTelefone.hasError('required')) {
      campos.push('telefone do responsável');
    }

    if (this.pessoaSobrinhoForm.controls.dataNascimento.hasError('required')) {
      campos.push('data de nascimento');
    }

    if (this.pessoaSobrinhoForm.controls.endereco.hasError('required')) {
      campos.push('endereço');
    }

    if (campos.length === 0) {
      return 'Revise os dados do encontrista antes de adicionar ao evento.';
    }

    if (campos.length === 1) {
      return `Informe ${campos[0]}.`;
    }

    const ultimo = campos.pop();

    return `Informe ${campos.join(', ')} e ${ultimo}.`;
  }

  private mensagemValidacaoSobrinho(): string {
    return this.mensagemValidacaoFormularioSobrinho(this.sobrinhoForm);
  }

  private mensagemValidacaoEdicaoSobrinho(): string {
    return this.mensagemValidacaoFormularioSobrinho(this.sobrinhoEdicaoForm);
  }

  private mensagemValidacaoFormularioSobrinho(formulario: any): string {
    const campos: string[] = [];

    if (formulario.controls.nome.hasError('required')) {
      campos.push('nome do encontrista');
    }

    if (formulario.controls.responsavelNome.hasError('required')) {
      campos.push('nome do responsável');
    }

    if (formulario.controls.responsavelTelefone.hasError('required')) {
      campos.push('telefone do responsável');
    }

    if (formulario.controls.dataNascimento.hasError('required')) {
      campos.push('data de nascimento');
    }

    if (formulario.controls.endereco.hasError('required')) {
      campos.push('endereço');
    }

    if (campos.length === 0) {
      return 'Revise os dados do sobrinho antes de salvar.';
    }

    if (campos.length === 1) {
      return `Informe ${campos[0]}.`;
    }

    const ultimo = campos.pop();

    return `Informe ${campos.join(', ')} e ${ultimo}.`;
  }

  private possuiIntegranteEmOutraEquipe(pessoaIds: number[], equipeIdIgnorada?: number): boolean {
    const idsSelecionados = new Set(pessoaIds ?? []);

    if (idsSelecionados.size === 0) {
      return false;
    }

    return this.equipesMontagemKit()
      .filter(equipe => !equipeIdIgnorada || equipe.id !== equipeIdIgnorada)
      .some(equipe =>
        equipe.integrantes.some(integrante => idsSelecionados.has(integrante.pessoaId))
      );
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

  duplaDoVinculo(vinculo: SobrinhoDupla): DuplaTioCarona | undefined {
    return this.duplas().find(dupla =>
      dupla.id === vinculo.duplaId || dupla.codigo === vinculo.duplaCodigo
    );
  }

  labelDuplaVinculo(vinculo: SobrinhoDupla): string {
    return this.nomeDuplaVinculo(vinculo);
  }

  tooltipDuplaVinculo(vinculo: SobrinhoDupla): string {
    const dupla = this.duplaDoVinculo(vinculo);

    if (!dupla) {
      return vinculo.duplaCodigo || `Dupla #${vinculo.duplaId}`;
    }

    return `${dupla.tio1Nome} e ${dupla.tio2Nome}`;
  }

  limparFormularioTio(): void {
    this.customFormHelper.resetarFormulario(this.tioForm, {
      pessoaId: 0,
      observacoes: ''
    });
  }

  limparFormularioDupla(): void {
    this.tio1Selecionado.set(0);
    this.tio2Selecionado.set(0);

    this.customFormHelper.resetarFormulario(this.duplaForm, {
      tio1Id: 0,
      tio2Id: 0,
      paroquiaComunidadeId: this.evento()?.paroquiaId ?? 0,
      apelido: ''
    });
  }

  limparFormularioPessoaSobrinho(): void {
    this.pessoaSobrinhoForm.reset({
      pessoaId: 0,
      telefone: '',
      responsavelNome: '',
      responsavelTelefone: '',
      endereco: '',
      dataNascimento: '',
      restricaoAlimentar: '',
      observacaoMedica: ''
    });

    for (const controle of [
      this.pessoaSobrinhoForm.controls.telefone,
      this.pessoaSobrinhoForm.controls.responsavelNome,
      this.pessoaSobrinhoForm.controls.responsavelTelefone,
      this.pessoaSobrinhoForm.controls.endereco,
      this.pessoaSobrinhoForm.controls.dataNascimento
    ]) {
      controle.enable({ emitEvent: false });
      controle.setValidators([Validators.required]);
      controle.updateValueAndValidity({ emitEvent: false });
    }

    this.pessoaSobrinhoForm.markAsPristine();
    this.pessoaSobrinhoForm.markAsUntouched();
  }

  limparFormularioSobrinho(): void {
    this.customFormHelper.resetarFormulario(this.sobrinhoForm, {
      nome: '',
      telefone: '',
      responsavelNome: '',
      responsavelTelefone: '',
      endereco: '',
      dataNascimento: '',
      restricaoAlimentar: '',
      observacaoMedica: ''
    });
  }

  limparFormularioVinculo(): void {
    this.customFormHelper.resetarFormulario(this.vinculoForm, {
      sobrinhoId: 0,
      duplaId: 0
    });
  }

  labelModoCadastroEncontrista(): string {
    return this.usarPessoaCadastradaEncontrista()
      ? 'Pessoa cadastrada'
      : 'Cadastro direto no evento';
  }

  descricaoModoCadastroEncontrista(): string {
    return this.usarPessoaCadastradaEncontrista()
      ? 'Selecione uma pessoa já cadastrada como encontrista.'
      : 'Cadastre o encontrista diretamente neste evento, sem usar o cadastro geral de Pessoas.';
  }
}