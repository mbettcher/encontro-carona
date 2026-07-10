import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';

import {
  DuplaStatus,
  DuplaTioCarona,
  Evento,
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
import { EventoGestaoService } from './evento-gestao.service';

type AbaGestao = 'TIOS' | 'DUPLAS' | 'SOBRINHOS' | 'VINCULOS';

interface OpcaoNumerica {
  label: string;
  value: number;
  descricao?: string;
}

@Component({
  selector: 'app-evento-gestao',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TextareaModule,
    TooltipModule
  ],
  templateUrl: './evento-gestao.component.html',
  styleUrl: './evento-gestao.component.scss'
})
export class EventoGestaoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(EventoGestaoService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly customFormHelper = inject(CustomFormHelperService);

  readonly eventoId = Number(this.route.snapshot.paramMap.get('eventoId'));

  readonly evento = signal<Evento | null>(null);
  readonly pessoas = signal<Pessoa[]>([]);
  readonly tiosCarona = signal<TioCaronaEvento[]>([]);
  readonly duplas = signal<DuplaTioCarona[]>([]);
  readonly sobrinhos = signal<Sobrinho[]>([]);
  readonly vinculos = signal<SobrinhoDupla[]>([]);

  readonly abaAtiva = signal<AbaGestao>('TIOS');
  readonly carregando = signal(false);
  readonly salvandoTio = signal(false);
  readonly salvandoDupla = signal(false);
  readonly salvandoSobrinho = signal(false);
  readonly salvandoVinculo = signal(false);
  readonly processandoDuplaId = signal<number | null>(null);
  readonly processandoVinculoId = signal<number | null>(null);

  readonly tioEdicaoVisivel = signal(false);
  readonly salvandoEdicaoTio = signal(false);
  readonly tioEmEdicao = signal<TioCaronaEvento | null>(null);

  readonly duplaEdicaoVisivel = signal(false);
  readonly salvandoEdicaoDupla = signal(false);
  readonly duplaEmEdicao = signal<DuplaTioCarona | null>(null);

  readonly sobrinhoEdicaoVisivel = signal(false);
  readonly salvandoEdicaoSobrinho = signal(false);
  readonly sobrinhoEmEdicao = signal<Sobrinho | null>(null);

  readonly vinculoTrocaDuplaVisivel = signal(false);
  readonly salvandoTrocaDupla = signal(false);
  readonly vinculoEmTroca = signal<SobrinhoDupla | null>(null);

  readonly modalSubstituirDuplaVisivel = signal(false);
  readonly vinculoEmSubstituicao = signal<SobrinhoDupla | null>(null);
  readonly salvandoSubstituicaoDupla = signal(false);

  readonly tio1Selecionado = signal(0);
  readonly tio2Selecionado = signal(0);
  readonly filtroTios = signal('');
  readonly filtroDuplas = signal('');
  readonly filtroSobrinhos = signal('');
  readonly filtroVinculos = signal('');

  readonly tioForm = this.fb.nonNullable.group({
    pessoaId: [0, [Validators.required, Validators.min(1)]],
    observacoes: ['', [Validators.maxLength(300)]]
  });

  readonly duplaForm = this.fb.nonNullable.group({
    tio1Id: [0, [Validators.required, Validators.min(1)]],
    tio2Id: [0, [Validators.required, Validators.min(1)]],
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

  readonly vinculoForm = this.fb.nonNullable.group({
    sobrinhoId: [0, [Validators.required, Validators.min(1)]],
    duplaId: [0, [Validators.required, Validators.min(1)]]
  });

  readonly tioEdicaoForm = this.fb.nonNullable.group({
    observacoes: ['', [Validators.maxLength(500)]]
  });

  readonly duplaEdicaoForm = this.fb.nonNullable.group({
    apelido: ['', [Validators.maxLength(120)]]
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

  readonly opcoesPessoasTioCarona = computed<OpcaoNumerica[]>(() => {
    const pessoasJaAdicionadas = new Set(
      this.tiosCarona()
        .filter(tio => tio.status === 'ATIVO')
        .map(tio => tio.pessoaId)
    );

    return this.pessoas()
      .filter(pessoa => pessoa.tipo === 'TIO_CARONA')
      .filter(pessoa => !pessoasJaAdicionadas.has(pessoa.id))
      .map(pessoa => ({
        label: pessoa.nome,
        value: pessoa.id
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
        descricao: `${dupla.tio1Nome} e ${dupla.tio2Nome}`,
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
        descricao: `${dupla.tio1Nome} e ${dupla.tio2Nome}`,
        value: dupla.id
      }));
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
        descricao: `${dupla.tio1Nome} e ${dupla.tio2Nome}`,
        value: dupla.id
      }));
  });

  ngOnInit(): void {
    this.carregarTudo();
  }

  carregarTudo(): void {
    this.carregando.set(true);

    this.carregarEvento();
    this.carregarPessoas();
    this.carregarTiosCarona();
    this.carregarDuplas();
    this.carregarSobrinhos();
    this.carregarVinculos();

    window.setTimeout(() => this.carregando.set(false), 600);
  }

  alterarAba(aba: AbaGestao): void {
    this.abaAtiva.set(aba);
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
        this.tioForm.reset({ pessoaId: 0, observacoes: '' });
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
      this.toastWarn('Selecione os dois tios carona para formar a dupla.');
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
      apelido: this.normalizarTextoOpcional(valor.apelido)
    }).subscribe({
      next: () => {
        this.toastSuccess('Dupla criada com sucesso.');
        this.salvandoDupla.set(false);
        this.duplaForm.reset({ tio1Id: 0, tio2Id: 0, apelido: '' });
        this.tio1Selecionado.set(0);
        this.tio2Selecionado.set(0);
        this.carregarDuplas();
        this.carregarVinculos();
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
        this.toastSuccess('Sobrinho cadastrado com sucesso.');
        this.salvandoSobrinho.set(false);
        this.sobrinhoForm.reset({
          nome: '',
          telefone: '',
          responsavelNome: '',
          responsavelTelefone: '',
          endereco: '',
          dataNascimento: '',
          restricaoAlimentar: '',
          observacaoMedica: ''
        });
        this.carregarSobrinhos();
      },
      error: erro => {
        console.error('Erro ao cadastrar sobrinho', erro);
        this.toastError(this.mensagemErro(erro, 'Não foi possível cadastrar o sobrinho.'));
        this.salvandoSobrinho.set(false);
      }
    });
  }

  vincularSobrinho(): void {
    if (this.opcoesSobrinhos().length === 0) {
      this.toastWarn('Não há sobrinhos disponíveis para vínculo. Cadastre novos sobrinhos ou revise os vínculos existentes.');
      return;
    }

    if (this.opcoesDuplas().length === 0) {
      this.toastWarn('Não há duplas disponíveis para vínculo. Forme pelo menos uma dupla ativa antes de vincular sobrinhos.');
      return;
    }

    if (this.vinculoForm.invalid) {
      this.vinculoForm.markAllAsTouched();
      this.toastWarn('Selecione o sobrinho e a dupla.');
      return;
    }

    const valor = this.vinculoForm.getRawValue();

    this.salvandoVinculo.set(true);

    this.service.vincularSobrinho(this.eventoId, {
      sobrinhoId: Number(valor.sobrinhoId),
      duplaId: Number(valor.duplaId)
    }).subscribe({
      next: () => {
        this.toastSuccess('Sobrinho vinculado à dupla com sucesso.');
        this.salvandoVinculo.set(false);
        this.vinculoForm.reset({ sobrinhoId: 0, duplaId: 0 });
        this.carregarVinculos();
        this.carregarSobrinhos();
      },
      error: erro => {
        console.error('Erro ao vincular sobrinho', erro);
        this.toastError(this.mensagemErro(erro, 'Não foi possível vincular o sobrinho à dupla.'));
        this.salvandoVinculo.set(false);
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
      apelido: dupla.apelido ?? ''
    });
    this.duplaEdicaoVisivel.set(true);
  }

  fecharEdicaoDupla(): void {
    this.duplaEdicaoVisivel.set(false);
    this.duplaEmEdicao.set(null);
    this.duplaEdicaoForm.reset({ apelido: '' });
  }

  salvarEdicaoDupla(): void {
    const dupla = this.duplaEmEdicao();

    if (!dupla) {
      return;
    }

    if (this.duplaEdicaoForm.invalid) {
      this.duplaEdicaoForm.markAllAsTouched();
      this.toastWarn('Revise o apelido da dupla antes de salvar.');
      return;
    }

    this.formatarEdicaoDupla();

    const valor = this.duplaEdicaoForm.getRawValue();

    this.salvandoEdicaoDupla.set(true);

    this.service.atualizarDupla(this.eventoId, dupla.id, {
      apelido: this.normalizarTextoOpcional(valor.apelido)
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
      telefone: sobrinho.telefone ?? '',
      responsavelNome: sobrinho.responsavelNome ?? '',
      responsavelTelefone: sobrinho.responsavelTelefone ?? '',
      endereco: sobrinho.endereco ?? '',
      dataNascimento: sobrinho.dataNascimento?.substring(0, 10) ?? '',
      restricaoAlimentar: sobrinho.restricaoAlimentar ?? '',
      observacaoMedica: sobrinho.observacaoMedica ?? ''
    });
    this.sobrinhoEdicaoVisivel.set(true);
  }

  fecharEdicaoSobrinho(): void {
    this.sobrinhoEdicaoVisivel.set(false);
    this.sobrinhoEmEdicao.set(null);
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
          this.toastSuccess('Sobrinho atualizado com sucesso.');
          this.fecharEdicaoSobrinho();
          this.carregarVinculos();
        },
        error: erro => {
          console.error('Erro ao atualizar sobrinho', erro);
          this.toastError(this.mensagemErro(erro, 'Não foi possível atualizar o sobrinho.'));
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

  private carregarEvento(): void {
    this.service.buscarEvento(this.eventoId).subscribe({
      next: evento => this.evento.set(evento),
      error: erro => {
        console.error('Erro ao carregar evento', erro);
        this.toastError('Não foi possível carregar os dados do evento.');
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

  private mensagemValidacaoSobrinho(): string {
    return this.mensagemValidacaoFormularioSobrinho(this.sobrinhoForm);
  }

  private mensagemValidacaoEdicaoSobrinho(): string {
    return this.mensagemValidacaoFormularioSobrinho(this.sobrinhoEdicaoForm);
  }

  private mensagemValidacaoFormularioSobrinho(formulario: any): string {
    const campos: string[] = [];

    if (formulario.controls.nome.hasError('required')) {
      campos.push('nome do sobrinho');
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
}