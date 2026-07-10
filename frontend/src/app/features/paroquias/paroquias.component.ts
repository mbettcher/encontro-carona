import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { Paroquia, ParoquiaRequest } from '../../shared/models';
import { CustomFormHelperService } from '../../shared/services/custom-form-helper.service';
import { TelefoneMaskDirective } from '../../shared/directives/telefone-mask.directive';
import { ParoquiasService } from './paroquias.service';

@Component({
  selector: 'app-paroquias',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    TableModule,
    TagModule,
    TelefoneMaskDirective
  ],
  templateUrl: './paroquias.component.html',
  styleUrl: './paroquias.component.scss'
})
export class ParoquiasComponent implements OnInit {
  private readonly service = inject(ParoquiasService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly customFormHelper = inject(CustomFormHelperService);

  readonly paroquias = signal<Paroquia[]>([]);
  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly paroquiaEmEdicao = signal<Paroquia | null>(null);

  readonly tituloFormulario = computed(() =>
    this.paroquiaEmEdicao() ? 'Editar paróquia' : 'Nova paróquia'
  );

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(160)]],
    endereco: ['', [Validators.maxLength(220)]],
    cidade: ['', [Validators.maxLength(120)]],
    uf: ['', [Validators.maxLength(2)]],
    telefone: ['', [Validators.maxLength(30)]],
    email: ['', [Validators.email, Validators.maxLength(160)]],
    responsavel: ['', [Validators.maxLength(160)]]
  });

  ngOnInit(): void {
    this.carregarParoquias();
  }

  carregarParoquias(): void {
    this.carregando.set(true);

    this.service.listar().subscribe({
      next: paroquias => {
        this.paroquias.set(paroquias);
        this.carregando.set(false);
      },
      error: erro => {
        console.error('Erro ao carregar paróquias', erro);

        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao carregar',
          detail: 'Não foi possível carregar as paróquias.',
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
        detail: 'Informe ao menos o nome da paróquia e corrija os campos inválidos.',
        life: 4500
      });

      return;
    }

    this.formatarCamposTexto();

    const payload = this.montarPayload();
    const paroquiaAtual = this.paroquiaEmEdicao();

    this.salvando.set(true);

    const requisicao = paroquiaAtual
      ? this.service.atualizar(paroquiaAtual.id, payload)
      : this.service.criar(payload);

    requisicao.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: paroquiaAtual ? 'Paróquia atualizada com sucesso.' : 'Paróquia cadastrada com sucesso.',
          life: 4000
        });

        this.salvando.set(false);
        this.limparFormulario();
        this.carregarParoquias();
      },
      error: erro => {
        console.error('Erro ao salvar paróquia', erro);

        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao salvar',
          detail: 'Não foi possível salvar a paróquia. Confira os dados informados.',
          life: 6000
        });

        this.salvando.set(false);
      }
    });
  }

  editar(paroquia: Paroquia): void {
    this.paroquiaEmEdicao.set(paroquia);

    this.form.patchValue({
      nome: paroquia.nome,
      endereco: paroquia.endereco ?? '',
      cidade: paroquia.cidade ?? '',
      uf: paroquia.uf ?? '',
      telefone: paroquia.telefone ?? '',
      email: paroquia.email ?? '',
      responsavel: paroquia.responsavel ?? ''
    });
  }

  cancelarEdicao(): void {
    this.limparFormulario();
  }

  formatarCamposTexto(): void {
    this.customFormHelper.formatarCamposComTitleCase(this.form, [
      'nome',
      'endereco',
      'cidade',
      'responsavel'
    ]);
  }

  enderecoFormatado(paroquia: Paroquia): string {
    const partes = [
      paroquia.endereco,
      paroquia.cidade,
      paroquia.uf
    ].filter(Boolean);

    return partes.length > 0 ? partes.join(' - ') : 'Não informado';
  }

  limparFormulario(): void {
    this.paroquiaEmEdicao.set(null);

    this.customFormHelper.resetarFormulario(this.form, {
      nome: '',
      endereco: '',
      cidade: '',
      uf: '',
      telefone: '',
      email: '',
      responsavel: ''
    });
  }

  private montarPayload(): ParoquiaRequest {
    const valor = this.form.getRawValue();

    return {
      nome: valor.nome.trim(),
      endereco: this.normalizarTextoOpcional(valor.endereco),
      cidade: this.normalizarTextoOpcional(valor.cidade),
      uf: this.normalizarUf(valor.uf),
      telefone: this.normalizarTextoOpcional(valor.telefone),
      email: this.normalizarTextoOpcional(valor.email),
      responsavel: this.normalizarTextoOpcional(valor.responsavel)
    };
  }

  private normalizarTextoOpcional(valor: string): string | undefined {
    const texto = valor?.trim();
    return texto ? texto : undefined;
  }

  private normalizarUf(valor: string): string | undefined {
    const texto = valor?.trim().toUpperCase();
    return texto ? texto : undefined;
  }
}