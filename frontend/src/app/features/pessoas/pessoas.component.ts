import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';

import { Pessoa, PessoaRequest, PessoaTipo } from '../../shared/models';
import { CustomFormHelperService } from '../../shared/services/custom-form-helper.service';
import { PessoasService } from './pessoas.service';

type TipoFiltro = PessoaTipo | 'TODOS';

interface TipoOpcao {
  label: string;
  value: PessoaTipo;
}

interface TipoFiltroOpcao {
  label: string;
  value: TipoFiltro;
}

@Component({
  selector: 'app-pessoas',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TextareaModule
  ],
  templateUrl: './pessoas.component.html',
  styleUrl: './pessoas.component.scss'
})
export class PessoasComponent implements OnInit {

  private readonly service = inject(PessoasService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly customFormHelper = inject(CustomFormHelperService);

  readonly pessoas = signal<Pessoa[]>([]);
  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly pessoaEmEdicao = signal<Pessoa | null>(null);
  readonly tipoFiltro = signal<TipoFiltro>('TODOS');

  readonly tiposPessoa: TipoOpcao[] = [
    { label: 'Tio Carona', value: 'TIO_CARONA' },
    { label: 'Encontrista', value: 'SOBRINHO' },
    { label: 'Responsável', value: 'RESPONSAVEL' },
    { label: 'Equipe', value: 'EQUIPE' }
  ];

  readonly tiposFiltro: TipoFiltroOpcao[] = [
    { label: 'Todos', value: 'TODOS' },
    { label: 'Tios Carona', value: 'TIO_CARONA' },
    { label: 'Encontristas', value: 'SOBRINHO' },
    { label: 'Responsáveis', value: 'RESPONSAVEL' },
    { label: 'Equipe', value: 'EQUIPE' }
  ];

  readonly pessoasFiltradas = computed(() => {
    const filtro = this.tipoFiltro();

    if (filtro === 'TODOS') {
      return this.pessoas();
    }

    return this.pessoas().filter(pessoa => pessoa.tipo === filtro);
  });

  readonly tituloFormulario = computed(() =>
    this.pessoaEmEdicao() ? 'Editar pessoa' : 'Nova pessoa'
  );

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(160)]],
    telefone: ['', [Validators.maxLength(30)]],
    email: ['', [Validators.email, Validators.maxLength(160)]],
    dataNascimento: [''],
    tipo: ['TIO_CARONA' as PessoaTipo, [Validators.required]],
    observacoes: ['', [Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    this.carregarPessoas();
  }

  carregarPessoas(): void {
    this.carregando.set(true);

    this.service.listar().subscribe({
      next: pessoas => {
        this.pessoas.set(pessoas);
        this.carregando.set(false);
      },
      error: erro => {
        console.error('Erro ao carregar pessoas', erro);

        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao carregar',
          detail: 'Não foi possível carregar as pessoas.',
          life: 5000
        });

        this.carregando.set(false);
      }
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.messageService.add({
        severity: 'warn',
        summary: 'Formulário incompleto',
        detail: 'Preencha os campos obrigatórios antes de salvar.',
        life: 4000
      });

      return;
    }

    this.formatarCamposTexto();

    const payload = this.montarPayload();
    const pessoaAtual = this.pessoaEmEdicao();

    this.salvando.set(false);

    const requisicao = pessoaAtual
      ? this.service.atualizar(pessoaAtual.id, payload)
      : this.service.criar(payload);

    this.salvando.set(true);

    requisicao.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: pessoaAtual ? 'Pessoa atualizada com sucesso.' : 'Pessoa cadastrada com sucesso.',
          life: 4000
        });

        this.salvando.set(false);
        this.limparFormulario();
        this.carregarPessoas();
      },
      error: erro => {
        console.error('Erro ao salvar pessoa', erro);

        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao salvar',
          detail: 'Não foi possível salvar a pessoa. Confira os dados informados.',
          life: 6000
        });

        this.salvando.set(false);
      }
    });
  }

  editar(pessoa: Pessoa): void {
    this.pessoaEmEdicao.set(pessoa);

    this.form.patchValue({
      nome: pessoa.nome,
      telefone: pessoa.telefone ?? '',
      email: pessoa.email ?? '',
      dataNascimento: pessoa.dataNascimento ?? '',
      tipo: pessoa.tipo,
      observacoes: pessoa.observacoes ?? ''
    });
  }

  cancelarEdicao(): void {
    this.limparFormulario();
  }

  formatarCamposTexto(): void {
    this.customFormHelper.formatarCamposComTitleCase(this.form, ['nome']);
  }

  alterarFiltro(tipo: TipoFiltro): void {
    this.tipoFiltro.set(tipo);
  }

  labelTipo(tipo: PessoaTipo): string {
    return this.tiposPessoa.find(opcao => opcao.value === tipo)?.label ?? tipo;
  }

  severityTipo(tipo: PessoaTipo): 'success' | 'info' | 'warn' | 'secondary' {
    switch (tipo) {
      case 'TIO_CARONA':
        return 'success';
      case 'SOBRINHO':
        return 'info';
      case 'RESPONSAVEL':
        return 'warn';
      case 'EQUIPE':
        return 'secondary';
    }
  }

  private limparFormulario(): void {
    this.pessoaEmEdicao.set(null);

    this.form.reset({
      nome: '',
      telefone: '',
      email: '',
      dataNascimento: '',
      tipo: 'TIO_CARONA',
      observacoes: ''
    });
  }

  private montarPayload(): PessoaRequest {
    const valor = this.form.getRawValue();

    return {
      nome: valor.nome.trim(),
      telefone: this.normalizarTextoOpcional(valor.telefone),
      email: this.normalizarTextoOpcional(valor.email),
      dataNascimento: this.normalizarTextoOpcional(valor.dataNascimento),
      tipo: valor.tipo,
      observacoes: this.normalizarTextoOpcional(valor.observacoes)
    };
  }

  private normalizarTextoOpcional(valor: string): string | undefined {
    const texto = valor?.trim();
    return texto ? texto : undefined;
  }
}