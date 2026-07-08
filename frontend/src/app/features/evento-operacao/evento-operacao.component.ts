import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DuplaTioCarona, Evento, Sobrinho, TioCaronaEvento } from '../../shared/models';
import { extrairMensagemErro } from '../../shared/utils/http-error.util';
import { EventoOperacaoService } from './evento-operacao.service';

type CardOperacional = {
  titulo: string;
  descricao: string;
  icone: string;
  rota?: unknown[];
  habilitado: boolean;
  badge: string;
};

@Component({
  standalone: true,
  selector: 'app-evento-operacao',
  imports: [CommonModule, RouterLink],
  templateUrl: './evento-operacao.component.html',
  styleUrl: './evento-operacao.component.scss'
})
export class EventoOperacaoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly eventoOperacaoService = inject(EventoOperacaoService);

  eventoId = Number(this.route.snapshot.paramMap.get('eventoId'));

  carregando = signal(false);
  mensagemErro = signal('');

  evento = signal<Evento | null>(null);
  tios = signal<TioCaronaEvento[]>([]);
  duplas = signal<DuplaTioCarona[]>([]);
  sobrinhos = signal<Sobrinho[]>([]);

  tiosAtivos = computed(() => this.tios().filter(tio => tio.status === 'ATIVO').length);
  duplasAtivas = computed(() => this.duplas().filter(dupla => dupla.status === 'ATIVA').length);
  sobrinhosInscritos = computed(() => this.sobrinhos().filter(sobrinho => sobrinho.status === 'INSCRITO').length);
  sobrinhosPresentes = computed(() => this.sobrinhos().filter(sobrinho => sobrinho.status === 'PRESENTE').length);

  cards = computed<CardOperacional[]>(() => [
    {
      titulo: 'Gestão cadastral',
      descricao: 'Organizar tios carona, duplas, sobrinhos e vínculos antes da operação.',
      icone: 'fa-solid fa-people-group',
      rota: ['/eventos', this.eventoId, 'gestao'],
      habilitado: true,
      badge: 'Ativo'
    },
    {
      titulo: 'Check-in',
      descricao: 'Escanear a credencial da dupla e confirmar presença dos sobrinhos vinculados.',
      icone: 'fa-solid fa-clipboard-check',
      habilitado: false,
      badge: 'Próximo bloco'
    },
    {
      titulo: 'Caderno do Choro',
      descricao: 'Registrar a entrega do caderno para cada sobrinho por dupla responsável.',
      icone: 'fa-solid fa-book-open',
      habilitado: false,
      badge: 'Próximo bloco'
    },
    {
      titulo: 'Checkout',
      descricao: 'Registrar saída da dupla e conferência final das responsabilidades.',
      icone: 'fa-solid fa-right-from-bracket',
      habilitado: false,
      badge: 'Próximo bloco'
    },
    {
      titulo: 'Mapa dos tios carona',
      descricao: 'Monitorar os tios carona nos dias do evento, dentro da janela configurada.',
      icone: 'fa-solid fa-map-location-dot',
      habilitado: false,
      badge: 'Roadmap'
    }
  ]);

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.mensagemErro.set('');

    forkJoin({
      eventos: this.eventoOperacaoService.listarEventos(),
      tios: this.eventoOperacaoService.listarTiosCarona(this.eventoId),
      duplas: this.eventoOperacaoService.listarDuplas(this.eventoId),
      sobrinhos: this.eventoOperacaoService.listarSobrinhos(this.eventoId)
    }).subscribe({
      next: dados => {
        this.evento.set(dados.eventos.find(evento => evento.id === this.eventoId) || null);
        this.tios.set(dados.tios);
        this.duplas.set(dados.duplas);
        this.sobrinhos.set(dados.sobrinhos);
      },
      error: error => this.mensagemErro.set(extrairMensagemErro(error)),
      complete: () => this.carregando.set(false)
    });
  }
}
