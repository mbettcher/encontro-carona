import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { APP_BUILD_INFO } from '../../core/app-version';
import { AuthService } from '../../core/auth/auth.service';

interface ChecklistItem {
  label: string;
  status: 'OK';
  detalhe: string;
}

interface ChecklistGroup {
  titulo: string;
  icon: string;
  cor: 'primary' | 'success' | 'warning' | 'info' | 'secondary';
  itens: ChecklistItem[];
}

@Component({
  selector: 'app-sobre-versao',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './sobre-versao.component.html',
  styleUrl: './sobre-versao.component.scss'
})
export class SobreVersaoComponent {
  private readonly auth = inject(AuthService);

  readonly buildInfo = APP_BUILD_INFO;

  readonly usuarioAtual = computed(() => this.auth.usuario());
  readonly perfilAtualLabel = computed(() =>
    this.auth.labelPerfil(this.usuarioAtual()?.perfil)
  );

  readonly checklist: ChecklistGroup[] = [
    {
      titulo: 'Pessoa e Encontrista',
      icon: 'fa-solid fa-people-arrows',
      cor: 'primary',
      itens: [
        {
          label: 'Vínculo com Pessoa',
          status: 'OK',
          detalhe: 'Encontristas podem ser vinculados a Pessoas cadastradas sem interromper registros exclusivos do evento.'
        },
        {
          label: 'Herança protegida',
          status: 'OK',
          detalhe: 'Dados existentes da Pessoa são herdados e bloqueados no formulário do Encontrista.'
        },
        {
          label: 'Complementação segura',
          status: 'OK',
          detalhe: 'Somente dados ausentes são complementados na Pessoa; valores existentes não são sobrescritos.'
        },
        {
          label: 'Snapshot histórico',
          status: 'OK',
          detalhe: 'O Encontrista mantém a cópia dos dados utilizados no evento, preservando o histórico da inscrição.'
        }
      ]
    },
    {
      titulo: 'Formulários e validações',
      icon: 'fa-solid fa-list-check',
      cor: 'success',
      itens: [
        {
          label: 'Criação e edição',
          status: 'OK',
          detalhe: 'Cadastro direto, Pessoa vinculada e edição de Encontrista foram revisados e homologados.'
        },
        {
          label: 'Campos herdados',
          status: 'OK',
          detalhe: 'Campos ausentes permanecem editáveis com obrigatoriedade e limites de tamanho preservados.'
        },
        {
          label: 'Estados assíncronos',
          status: 'OK',
          detalhe: 'Carregamentos e salvamentos utilizam coordenação real das requisições e encerramento com finalize.'
        },
        {
          label: 'Mensagens da API',
          status: 'OK',
          detalhe: 'Erros de negócio, validação, conexão e permissão são apresentados de forma padronizada.'
        }
      ]
    },
    {
      titulo: 'Banco e compatibilidade',
      icon: 'fa-solid fa-database',
      cor: 'info',
      itens: [
        {
          label: 'Migration V17',
          status: 'OK',
          detalhe: 'Pessoa recebeu responsável, telefone do responsável e endereço como campos opcionais.'
        },
        {
          label: 'Registros legados',
          status: 'OK',
          detalhe: 'Encontristas antigos sem pessoa_id continuam válidos e operacionais.'
        },
        {
          label: 'Backfill controlado',
          status: 'OK',
          detalhe: 'Dados legados de Encontristas vinculados complementam somente campos vazios da Pessoa.'
        },
        {
          label: 'Unicidade por evento',
          status: 'OK',
          detalhe: 'A mesma Pessoa não pode ser vinculada mais de uma vez como Encontrista no mesmo evento.'
        }
      ]
    },
    {
      titulo: 'Qualidade da release',
      icon: 'fa-solid fa-circle-check',
      cor: 'warning',
      itens: [
        {
          label: 'Testes automatizados',
          status: 'OK',
          detalhe: 'Testes de complementação, proteção contra sobrescrita, snapshot e duplicidade foram aprovados.'
        },
        {
          label: 'Testes funcionais',
          status: 'OK',
          detalhe: 'Criação, edição, troca, limpeza, herança e complementação foram homologadas.'
        },
        {
          label: 'Frontend e backend',
          status: 'OK',
          detalhe: 'Aplicações compiladas, executadas e validadas em conjunto após os pacotes do ciclo 1.2.1.'
        },
        {
          label: 'Limpeza técnica',
          status: 'OK',
          detalhe: 'Validações, mensagens e estilos das abas foram centralizados e revisados.'
        }
      ]
    }
  ];

  readonly totalItens = computed(() =>
    this.checklist.reduce(
      (total, grupo) => total + grupo.itens.length,
      0
    )
  );

  readonly totalOk = computed(() => this.totalItens());

  classeBorda(cor: ChecklistGroup['cor']): string {
    return `release-card-${cor}`;
  }
}
