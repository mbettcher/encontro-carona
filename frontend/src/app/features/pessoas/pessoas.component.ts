import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmationService, MessageService } from 'primeng/api';

import { Pessoa, PessoaRequest, PessoaTipo } from '../../shared/models';
import { CustomFormHelperService } from '../../shared/services/custom-form-helper.service';
import { AuthService } from '../../core/auth/auth.service';
import { TelefoneMaskDirective } from '../../shared/directives/telefone-mask.directive';
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
    ConfirmDialogModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TextareaModule,
    TelefoneMaskDirective,
    TooltipModule
  ],
  templateUrl: './pessoas.component.html',
  providers: [ConfirmationService],
  styleUrl: './pessoas.component.scss'
})
export class PessoasComponent implements OnInit {

  readonly seguranca = inject(AuthService);

  private readonly service = inject(PessoasService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly customFormHelper = inject(CustomFormHelperService);

  readonly pessoas = signal<Pessoa[]>([]);
  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly pessoaEmEdicao = signal<Pessoa | null>(null);
  readonly tipoFiltro = signal<TipoFiltro>('TODOS');
  readonly filtroBusca = signal('');

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
    const tipo = this.tipoFiltro();
    const busca = this.normalizarFiltro(this.filtroBusca());

    return this.pessoas()
      .filter(pessoa => tipo === 'TODOS' || pessoa.tipo === tipo)
      .filter(pessoa => {
        if (!busca) {
          return true;
        }

        return this.contemFiltro(pessoa.nome, busca) ||
          this.contemFiltro(this.labelTipo(pessoa.tipo), busca) ||
          this.contemFiltro(pessoa.telefone, busca) ||
          this.contemFiltro(pessoa.email, busca) ||
          this.contemFiltro(pessoa.responsavelNome, busca) ||
          this.contemFiltro(pessoa.responsavelTelefone, busca) ||
          this.contemFiltro(pessoa.endereco, busca) ||
          this.contemFiltro(pessoa.observacoes, busca) ||
          this.contemFiltro(this.formatarData(pessoa.dataNascimento), busca);
      });
  });

  readonly tituloFormulario = computed(() =>
    this.pessoaEmEdicao() ? 'Editar pessoa' : 'Nova pessoa'
  );

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(150)]],
    telefone: ['', [Validators.maxLength(30)]],
    email: ['', [Validators.email, Validators.maxLength(120)]],
    dataNascimento: [''],
    tipo: ['TIO_CARONA' as PessoaTipo, [Validators.required]],
    responsavelNome: ['', [Validators.maxLength(150)]],
    responsavelTelefone: ['', [Validators.maxLength(30)]],
    endereco: ['', [Validators.maxLength(180)]],
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
      responsavelNome: pessoa.responsavelNome ?? '',
      responsavelTelefone: pessoa.responsavelTelefone ?? '',
      endereco: pessoa.endereco ?? '',
      observacoes: pessoa.observacoes ?? ''
    });
  }


  inativar(pessoa: Pessoa): void {
    this.confirmationService.confirm({
      header: 'Confirmar inativação',
      message: `Inativar a pessoa "${pessoa.nome}"?`,
      icon: 'fa-solid fa-triangle-exclamation',
      acceptLabel: 'Inativar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => this.executarInativacao(pessoa)
    });
  }

  reativar(pessoa: Pessoa): void {
    this.confirmationService.confirm({
      header: 'Confirmar reativação',
      message: `Reativar a pessoa "${pessoa.nome}"?`,
      icon: 'fa-solid fa-circle-check',
      acceptLabel: 'Reativar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => this.executarReativacao(pessoa)
    });
  }

  excluir(pessoa: Pessoa): void {
    this.confirmationService.confirm({
      header: 'Confirmar exclusão definitiva',
      message: `Excluir definitivamente a pessoa "${pessoa.nome}"?<br><br>A exclusão só será permitida se não houver vínculos. Esta ação não pode ser desfeita.`,
      icon: 'fa-solid fa-triangle-exclamation',
      acceptLabel: 'Excluir definitivamente',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => this.executarExclusao(pessoa)
    });
  }

  private executarInativacao(pessoa: Pessoa): void {
    this.service.inativar(pessoa.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Pessoa inativada',
          detail: 'Pessoa inativada com sucesso.',
          life: 4000
        });

        this.carregarPessoas();
      },
      error: erro => this.exibirErroOperacao(erro, 'Não foi possível inativar a pessoa.')
    });
  }


  private executarReativacao(pessoa: Pessoa): void {
    this.service.reativar(pessoa.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Pessoa reativada',
          detail: 'Pessoa reativada com sucesso.',
          life: 4000
        });

        this.carregarPessoas();
      },
      error: erro => this.exibirErroOperacao(erro, 'Não foi possível reativar a pessoa.')
    });
  }


  private executarExclusao(pessoa: Pessoa): void {
    this.service.excluir(pessoa.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Pessoa excluída',
          detail: 'Pessoa excluída com sucesso.',
          life: 4000
        });

        this.carregarPessoas();
      },
      error: erro => this.exibirErroOperacao(erro, 'Não foi possível excluir. Se houver vínculos, utilize a inativação.')
    });
  }


  labelAtivo(ativo: boolean): string {
    return ativo ? 'Ativa' : 'Inativa';
  }

  cancelarEdicao(): void {
    this.limparFormulario();
  }

  formatarCamposTexto(): void {
    this.customFormHelper.formatarCamposComTitleCase(
      this.form,
      ['nome', 'responsavelNome']
    );
  }

  alterarFiltro(tipo: TipoFiltro): void {
    this.tipoFiltro.set(tipo);
  }

  alterarBusca(valor: string): void {
    this.filtroBusca.set(valor);
  }

  formatarData(data?: string): string {
    if (!data) {
      return '';
    }

    const [ano, mes, dia] = data.substring(0, 10).split('-');

    if (!ano || !mes || !dia) {
      return data;
    }

    return `${dia}/${mes}/${ano}`;
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

  possuiDadosResponsavel(pessoa: Pessoa): boolean {
    return Boolean(
      pessoa.responsavelNome ||
      pessoa.responsavelTelefone
    );
  }

  limparFormulario(): void {
    this.pessoaEmEdicao.set(null);

    this.customFormHelper.resetarFormulario(this.form, {
      nome: '',
      telefone: '',
      email: '',
      dataNascimento: '',
      tipo: 'TIO_CARONA' as PessoaTipo,
      responsavelNome: '',
      responsavelTelefone: '',
      endereco: '',
      observacoes: ''
    });
  }


  private exibirErroOperacao(erro: unknown, mensagemPadrao: string): void {
    console.error(mensagemPadrao, erro);

    const mensagemApi = (erro as { error?: { message?: string } })?.error?.message;

    this.messageService.add({
      severity: 'error',
      summary: 'Operação não realizada',
      detail: mensagemApi || mensagemPadrao,
      life: 6000
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
      responsavelNome: this.normalizarTextoOpcional(valor.responsavelNome),
      responsavelTelefone: this.normalizarTextoOpcional(valor.responsavelTelefone),
      endereco: this.normalizarTextoOpcional(valor.endereco),
      observacoes: this.normalizarTextoOpcional(valor.observacoes)
    };
  }

  private normalizarTextoOpcional(valor: string): string | undefined {
    const texto = valor?.trim();
    return texto ? texto : undefined;
  }

  private normalizarFiltro(valor: string): string {
    return String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private contemFiltro(valor: string | undefined, filtro: string): boolean {
    if (!valor) {
      return false;
    }

    return this.normalizarFiltro(valor).includes(filtro);
  }
}