import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';
import { DuplaTioCarona, Evento, Pessoa, Sobrinho, SobrinhoDupla, TioCaronaEvento } from '../../shared/models';
import { extrairMensagemErro } from '../../shared/utils/http-error.util';
import { EventoGestaoService } from './evento-gestao.service';

@Component({
  standalone: true,
  selector: 'app-evento-gestao',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './evento-gestao.component.html',
  styleUrl: './evento-gestao.component.scss'
})
export class EventoGestaoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly eventoGestaoService = inject(EventoGestaoService);
  private readonly fb = inject(FormBuilder);

  eventoId = Number(this.route.snapshot.paramMap.get('eventoId'));
  aba = signal<'tios' | 'duplas' | 'sobrinhos' | 'vinculos'>('tios');
  carregando = signal(false);
  salvando = signal(false);
  mensagemErro = signal('');
  mensagemSucesso = signal('');

  evento = signal<Evento | null>(null);
  pessoas = signal<Pessoa[]>([]);
  tios = signal<TioCaronaEvento[]>([]);
  duplas = signal<DuplaTioCarona[]>([]);
  sobrinhos = signal<Sobrinho[]>([]);
  vinculos = signal<SobrinhoDupla[]>([]);

  pessoasTioCarona = computed(() => this.pessoas().filter(p => p.tipo === 'TIO_CARONA'));

  tioForm = this.fb.nonNullable.group({ pessoaId: [0, [Validators.required, Validators.min(1)]], observacoes: [''] });
  duplaForm = this.fb.nonNullable.group({ tio1Id: [0, [Validators.required, Validators.min(1)]], tio2Id: [0, [Validators.required, Validators.min(1)]], apelido: [''] });
  sobrinhoForm = this.fb.nonNullable.group({ nome: ['', [Validators.required]], telefone: [''], responsavelNome: [''], responsavelTelefone: [''], endereco: [''], dataNascimento: [''], restricaoAlimentar: [''], observacaoMedica: [''] });
  vinculoForm = this.fb.nonNullable.group({ sobrinhoId: [0, [Validators.required, Validators.min(1)]], duplaId: [0, [Validators.required, Validators.min(1)]] });

  ngOnInit(): void {
    this.carregarTudo();
  }

  carregarTudo(): void {
    this.carregando.set(true);
    this.mensagemErro.set('');

    forkJoin({
      eventos: this.eventoGestaoService.listarEventos(),
      pessoas: this.eventoGestaoService.listarPessoas(),
      tios: this.eventoGestaoService.listarTiosCarona(this.eventoId),
      duplas: this.eventoGestaoService.listarDuplas(this.eventoId),
      sobrinhos: this.eventoGestaoService.listarSobrinhos(this.eventoId)
    }).subscribe({
      next: dados => {
        this.evento.set(dados.eventos.find(e => e.id === this.eventoId) || null);
        this.pessoas.set(dados.pessoas);
        this.tios.set(dados.tios);
        this.duplas.set(dados.duplas);
        this.sobrinhos.set(dados.sobrinhos);
      },
      error: error => this.mensagemErro.set(extrairMensagemErro(error)),
      complete: () => this.carregando.set(false)
    });
  }

  adicionarTio(): void {
    if (this.tioForm.invalid) return;
    this.executar(
      () => this.eventoGestaoService.adicionarTioCarona(this.eventoId, this.tioForm.getRawValue()),
      'Tio carona adicionado ao evento.',
      () => this.tioForm.reset({ pessoaId: 0, observacoes: '' })
    );
  }

  criarDupla(): void {
    if (this.duplaForm.invalid) return;
    const request = this.duplaForm.getRawValue();
    if (request.tio1Id === request.tio2Id) {
      this.mensagemErro.set('A dupla deve ter dois tios carona diferentes.');
      return;
    }
    this.executar(
      () => this.eventoGestaoService.criarDupla(this.eventoId, request),
      'Dupla criada com sucesso.',
      () => this.duplaForm.reset({ tio1Id: 0, tio2Id: 0, apelido: '' })
    );
  }

  criarSobrinho(): void {
    if (this.sobrinhoForm.invalid) return;
    this.executar(
      () => this.eventoGestaoService.criarSobrinho(this.eventoId, this.sobrinhoForm.getRawValue()),
      'Sobrinho cadastrado com sucesso.',
      () => this.sobrinhoForm.reset()
    );
  }

  vincularSobrinho(): void {
    if (this.vinculoForm.invalid) return;
    this.executar(
      () => this.eventoGestaoService.vincularSobrinho(this.eventoId, this.vinculoForm.getRawValue()),
      'Sobrinho vinculado à dupla com sucesso.',
      () => this.carregarVinculosDaDupla()
    );
  }

  carregarVinculosDaDupla(): void {
    const duplaId = this.vinculoForm.getRawValue().duplaId;
    if (!duplaId) {
      this.vinculos.set([]);
      return;
    }

    this.eventoGestaoService.listarSobrinhosDaDupla(this.eventoId, duplaId).subscribe({
      next: dados => this.vinculos.set(dados),
      error: error => this.mensagemErro.set(extrairMensagemErro(error))
    });
  }

  private executar<T>(operacao: () => Observable<T>, sucesso: string, aposSucesso?: () => void): void {
    this.salvando.set(true);
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');

    operacao().subscribe({
      next: () => {
        this.mensagemSucesso.set(sucesso);
        aposSucesso?.();
        this.carregarTudo();
      },
      error: (error: unknown) => this.mensagemErro.set(extrairMensagemErro(error)),
      complete: () => this.salvando.set(false)
    });
  }
}
