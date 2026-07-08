import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Paroquia, ParoquiaRequest } from '../../shared/models';
import { extrairMensagemErro } from '../../shared/utils/http-error.util';
import { ParoquiasService } from './paroquias.service';

@Component({
  standalone: true,
  selector: 'app-paroquias',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './paroquias.component.html',
  styleUrl: './paroquias.component.scss'
})
export class ParoquiasComponent implements OnInit {
  private readonly paroquiasService = inject(ParoquiasService);
  private readonly fb = inject(FormBuilder);

  itens = signal<Paroquia[]>([]);
  carregando = signal(false);
  salvando = signal(false);
  editandoId = signal<number | null>(null);
  mensagemErro = signal('');
  mensagemSucesso = signal('');

  form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(150)]],
    endereco: ['', [Validators.maxLength(180)]],
    cidade: ['', [Validators.maxLength(80)]],
    uf: ['', [Validators.maxLength(2)]],
    telefone: ['', [Validators.maxLength(30)]],
    email: ['', [Validators.email, Validators.maxLength(120)]],
    responsavel: ['', [Validators.maxLength(120)]]
  });

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.paroquiasService.listar().subscribe({
      next: dados => this.itens.set(dados),
      error: error => this.mensagemErro.set(extrairMensagemErro(error)),
      complete: () => this.carregando.set(false)
    });
  }

  editar(item: Paroquia): void {
    this.editandoId.set(item.id);
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');
    this.form.patchValue({
      nome: item.nome,
      endereco: item.endereco || '',
      cidade: item.cidade || '',
      uf: item.uf || '',
      telefone: item.telefone || '',
      email: item.email || '',
      responsavel: item.responsavel || ''
    });
  }

  novo(): void {
    this.editandoId.set(null);
    this.form.reset();
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');
  }

  salvar(): void {
    if (this.form.invalid) return;
    this.salvando.set(true);
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');

    const request = this.form.getRawValue() as ParoquiaRequest;
    const id = this.editandoId();
    const operacao = id
      ? this.paroquiasService.atualizar(id, request)
      : this.paroquiasService.criar(request);

    operacao.subscribe({
      next: () => {
        this.mensagemSucesso.set(id ? 'Paróquia atualizada com sucesso.' : 'Paróquia cadastrada com sucesso.');
        this.novo();
        this.carregar();
      },
      error: error => this.mensagemErro.set(extrairMensagemErro(error)),
      complete: () => this.salvando.set(false)
    });
  }
}
