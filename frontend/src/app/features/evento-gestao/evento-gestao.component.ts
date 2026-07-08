import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';

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
  VinculoStatus
} from '../../shared/models';
import { EventoGestaoService } from './evento-gestao.service';

type AbaGestao = 'TIOS' | 'DUPLAS' | 'SOBRINHOS' | 'VINCULOS';

interface OpcaoNumerica {
  label: string;
  value: number;
}

@Component({
  selector: 'app-evento-gestao',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TextareaModule
  ],
  templateUrl: './evento-gestao.component.html',
  styleUrl: './evento-gestao.component.scss'
})
export class EventoGestaoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(EventoGestaoService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

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

  readonly opcoesPessoasTioCarona = computed<OpcaoNumerica[]>(() =>
    this.pessoas()
      .filter(pessoa => pessoa.tipo === 'TIO_CARONA')
      .map(pessoa => ({
        label: pessoa.nome,
        value: pessoa.id
      }))
  );

  readonly opcoesTiosEvento = computed<OpcaoNumerica[]>(() =>
    this.tiosCarona()
      .filter(tio => tio.status === 'ATIVO')
      .map(tio => ({
        label: tio.pessoaNome,
        value: tio.id
      }))
  );

  readonly opcoesDuplas = computed<OpcaoNumerica[]>(() =>
    this.duplas()
      .filter(dupla => dupla.status === 'ATIVA')
      .map(dupla => ({
        label: `${dupla.codigo} - ${dupla.tio1Nome} e ${dupla.tio2Nome}`,
        value: dupla.id
      }))
  );

  readonly opcoesSobrinhos = computed<OpcaoNumerica[]>(() =>
    this.sobrinhos()
      .filter(sobrinho => sobrinho.status === 'INSCRITO' || sobrinho.status === 'PRESENTE')
      .map(sobrinho => ({
        label: sobrinho.nome,
        value: sobrinho.id
      }))
  );

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
    nome: ['', [Validators.required, Validators.maxLength(160)]],
    telefone: ['', [Validators.maxLength(30)]],
    responsavelNome: ['', [Validators.maxLength(160)]],
    responsavelTelefone: ['', [Validators.maxLength(30)]],
    endereco: ['', [Validators.maxLength(220)]],
    dataNascimento: [''],
    restricaoAlimentar: ['', [Validators.maxLength(300)]],
    observacaoMedica: ['', [Validators.maxLength(500)]]
  });

  readonly vinculoForm = this.fb.nonNullable.group({
    sobrinhoId: [0, [Validators.required, Validators.min(1)]],
    duplaId: [0, [Validators.required, Validators.min(1)]]
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
        console.error('Erro ao adicionar tio carona', erro);
        this.toastError('Não foi possível adicionar o tio carona ao evento.');
        this.salvandoTio.set(false);
      }
    });
  }

  criarDupla(): void {
    if (this.duplaForm.invalid) {
      this.duplaForm.markAllAsTouched();
      this.toastWarn('Selecione os dois tios carona para formar a dupla.');
      return;
    }

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
        this.carregarDuplas();
        this.carregarVinculos();
      },
      error: erro => {
        console.error('Erro ao criar dupla', erro);
        this.toastError('Não foi possível criar a dupla. Confira se os tios já não estão em outra dupla ativa.');
        this.salvandoDupla.set(false);
      }
    });
  }

  criarSobrinho(): void {
    if (this.sobrinhoForm.invalid) {
      this.sobrinhoForm.markAllAsTouched();
      this.toastWarn('Informe ao menos o nome do sobrinho.');
      return;
    }

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
        this.toastError('Não foi possível cadastrar o sobrinho.');
        this.salvandoSobrinho.set(false);
      }
    });
  }

  vincularSobrinho(): void {
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
        this.toastError('Não foi possível vincular o sobrinho à dupla.');
        this.salvandoVinculo.set(false);
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
}