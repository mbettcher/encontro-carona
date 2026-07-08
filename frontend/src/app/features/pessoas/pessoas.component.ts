import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Pessoa, PessoaRequest, PessoaTipo } from '../../shared/models';
import { extrairMensagemErro } from '../../shared/utils/http-error.util';
import { PessoasService } from './pessoas.service';

@Component({
  standalone: true,
  selector: 'app-pessoas',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pessoas.component.html',
  styleUrl: './pessoas.component.scss'
})
export class PessoasComponent implements OnInit {
  private readonly pessoasService = inject(PessoasService);
  private readonly fb = inject(FormBuilder);

  itens = signal<Pessoa[]>([]);
  busca = signal('');
  carregando = signal(false);
  salvando = signal(false);
  editandoId = signal<number | null>(null);
  mensagemErro = signal('');
  mensagemSucesso = signal('');

  tipos: { valor: PessoaTipo; label: string }[] = [
    { valor: 'TIO_CARONA', label: 'Tio carona' },
    { valor: 'EQUIPE', label: 'Equipe' },
    { valor: 'RESPONSAVEL', label: 'Responsável' },
    { valor: 'SOBRINHO', label: 'Sobrinho' }
  ];

  form = this.fb.nonNullable.group({
    nome: ['', [Validators.required]],
    telefone: [''],
    email: ['', [Validators.email]],
    dataNascimento: [''],
    tipo: ['TIO_CARONA' as PessoaTipo, [Validators.required]],
    observacoes: ['']
  });

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.pessoasService.listar(this.busca()).subscribe({
      next: dados => this.itens.set(dados),
      error: error => this.mensagemErro.set(extrairMensagemErro(error)),
      complete: () => this.carregando.set(false)
    });
  }

  editar(item: Pessoa): void {
    this.editandoId.set(item.id);
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');
    this.form.patchValue({
      nome: item.nome,
      telefone: item.telefone || '',
      email: item.email || '',
      dataNascimento: item.dataNascimento || '',
      tipo: item.tipo,
      observacoes: item.observacoes || ''
    });
  }

  novo(): void {
    this.editandoId.set(null);
    this.form.reset({ nome: '', telefone: '', email: '', dataNascimento: '', tipo: 'TIO_CARONA', observacoes: '' });
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');
  }

  salvar(): void {
    if (this.form.invalid) return;
    this.salvando.set(true);
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');

    const request = this.form.getRawValue() as PessoaRequest;
    const id = this.editandoId();
    const operacao = id
      ? this.pessoasService.atualizar(id, request)
      : this.pessoasService.criar(request);

    operacao.subscribe({
      next: () => {
        this.mensagemSucesso.set(id ? 'Pessoa atualizada com sucesso.' : 'Pessoa cadastrada com sucesso.');
        this.novo();
        this.carregar();
      },
      error: error => this.mensagemErro.set(extrairMensagemErro(error)),
      complete: () => this.salvando.set(false)
    });
  }

  rotuloTipo(tipo: PessoaTipo): string {
    return this.tipos.find(t => t.valor === tipo)?.label || tipo;
  }
}
