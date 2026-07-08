import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Evento, EventoRequest, Paroquia } from '../../shared/models';
import { extrairMensagemErro } from '../../shared/utils/http-error.util';
import { ParoquiasService } from '../paroquias/paroquias.service';
import { EventosService } from './eventos.service';

@Component({
  standalone: true,
  selector: 'app-eventos',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './eventos.component.html',
  styleUrl: './eventos.component.scss'
})
export class EventosComponent implements OnInit {
  private readonly eventosService = inject(EventosService);
  private readonly paroquiasService = inject(ParoquiasService);
  private readonly fb = inject(FormBuilder);

  itens = signal<Evento[]>([]);
  paroquias = signal<Paroquia[]>([]);
  carregando = signal(false);
  salvando = signal(false);
  editandoId = signal<number | null>(null);
  mensagemErro = signal('');
  mensagemSucesso = signal('');

  form = this.fb.nonNullable.group({
    paroquiaId: [0, [Validators.required, Validators.min(1)]],
    nome: ['', [Validators.required]],
    tema: [''],
    dataInicio: ['', [Validators.required]],
    dataFim: ['', [Validators.required]],
    local: [''],
    monitoramentoInicio: ['05:00'],
    monitoramentoFim: ['20:00'],
    monitoramentoAtivo: [false]
  });

  ngOnInit(): void {
    this.carregarParoquias();
    this.carregar();
  }

  carregarParoquias(): void {
    this.paroquiasService.listar().subscribe({
      next: dados => this.paroquias.set(dados),
      error: error => this.mensagemErro.set(extrairMensagemErro(error))
    });
  }

  carregar(): void {
    this.carregando.set(true);
    this.eventosService.listar().subscribe({
      next: dados => this.itens.set(dados),
      error: error => this.mensagemErro.set(extrairMensagemErro(error)),
      complete: () => this.carregando.set(false)
    });
  }

  editar(item: Evento): void {
    this.editandoId.set(item.id);
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');
    this.form.patchValue({
      paroquiaId: item.paroquiaId,
      nome: item.nome,
      tema: item.tema || '',
      dataInicio: item.dataInicio,
      dataFim: item.dataFim,
      local: item.local || '',
      monitoramentoInicio: item.monitoramentoInicio || '05:00',
      monitoramentoFim: item.monitoramentoFim || '20:00',
      monitoramentoAtivo: item.monitoramentoAtivo
    });
  }

  novo(): void {
    this.editandoId.set(null);
    this.form.reset({ paroquiaId: 0, nome: '', tema: '', dataInicio: '', dataFim: '', local: '', monitoramentoInicio: '05:00', monitoramentoFim: '20:00', monitoramentoAtivo: false });
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');
  }

  salvar(): void {
    if (this.form.invalid || this.form.value.paroquiaId === 0) return;
    this.salvando.set(true);
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');

    const request = this.form.getRawValue() as EventoRequest;
    const id = this.editandoId();
    const operacao = id
      ? this.eventosService.atualizar(id, request)
      : this.eventosService.criar(request);

    operacao.subscribe({
      next: () => {
        this.mensagemSucesso.set(id ? 'Evento atualizado com sucesso.' : 'Evento cadastrado com sucesso.');
        this.novo();
        this.carregar();
      },
      error: error => this.mensagemErro.set(extrairMensagemErro(error)),
      complete: () => this.salvando.set(false)
    });
  }
}
