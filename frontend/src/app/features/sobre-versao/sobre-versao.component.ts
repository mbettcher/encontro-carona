import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { APP_BUILD_INFO } from '../../core/app-version';
import { AuthService } from '../../core/auth/auth.service';

interface ChecklistItem {
  label: string;
  status: 'OK' | 'VALIDAR';
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
  readonly perfilAtualLabel = computed(() => this.auth.labelPerfil(this.usuarioAtual()?.perfil));

  readonly checklist: ChecklistGroup[] = [
    {
      titulo: 'Segurança e acesso',
      icon: 'fa-solid fa-shield-halved',
      cor: 'primary',
      itens: [
        {
          label: 'Login/JWT',
          status: 'OK',
          detalhe: 'Login autenticado, token Bearer, logout e refresh token com rotação validados.'
        },
        {
          label: 'Sessão expirada',
          status: 'OK',
          detalhe: 'Sessão expirada limpa dados locais e redireciona para login sem quebrar navegação.'
        },
        {
          label: 'Perfis',
          status: 'OK',
          detalhe: 'ADMIN, OPERADOR_ADMIN, OPERADOR_LEITURA e SOMENTE_LEITURA aplicados em rotas e UX.'
        },
        {
          label: 'Administração de usuários',
          status: 'OK',
          detalhe: 'ADMIN lista, cria, edita perfil, ativa/desativa e reseta senha.'
        }
      ]
    },
    {
      titulo: 'Cadastros e gestão',
      icon: 'fa-solid fa-database',
      cor: 'success',
      itens: [
        {
          label: 'Paróquias/Comunidades',
          status: 'OK',
          detalhe: 'Textos de tela ajustados para o contexto Paróquia/Comunidade.'
        },
        {
          label: 'Pessoas e eventos',
          status: 'OK',
          detalhe: 'Cadastros principais, filtros e formulários revisados.'
        },
        {
          label: 'Gestão do Evento',
          status: 'OK',
          detalhe: 'Tios, duplas com Paróquia/Comunidade, encontristas, vínculos e equipes do kit validados.'
        },
        {
          label: 'Equipes do kit',
          status: 'OK',
          detalhe: 'Regra de uma pessoa por equipe do kit no evento aplicada no backend e no frontend.'
        }
      ]
    },
    {
      titulo: 'Operação do Evento',
      icon: 'fa-solid fa-people-group',
      cor: 'info',
      itens: [
        {
          label: 'Visão geral',
          status: 'OK',
          detalhe: 'Atalhos, cards e indicadores principais revisados para a versão 1.1.1.'
        },
        {
          label: 'Presença',
          status: 'OK',
          detalhe: 'Indicadores de presença e preparação consideram somente encontristas ativos.'
        },
        {
          label: 'Credenciais',
          status: 'OK',
          detalhe: 'Tela alinhada à Central de Impressão Jasper e sem rotas CSS/browser antigas.'
        },
        {
          label: 'Caderno de Mensagens',
          status: 'VALIDAR',
          detalhe: 'Fluxo atual mantido na 1.1.1; replanejamento completo recomendado para a versão 1.2.0.'
        }
      ]
    },
    {
      titulo: 'Relatórios e impressões Jasper',
      icon: 'fa-solid fa-print',
      cor: 'warning',
      itens: [
        {
          label: 'Relatórios',
          status: 'OK',
          detalhe: 'Listas de presença, cadernos por equipe e filtros Jasper validados.'
        },
        {
          label: 'Etiquetas QR Code',
          status: 'OK',
          detalhe: 'Modelos A4/Pimaco e filtro textual funcionando na Central de Impressão.'
        },
        {
          label: 'Crachás e carteirinhas',
          status: 'OK',
          detalhe: 'Crachás verticais e carteirinhas horizontais gerados por Jasper.'
        },
        {
          label: 'Limpeza técnica',
          status: 'VALIDAR',
          detalhe: 'Arquivos físicos das impressões CSS antigas podem ser removidos após aplicar este bloco.'
        }
      ]
    }
  ];

  readonly totalItens = computed(() =>
    this.checklist.reduce((total, grupo) => total + grupo.itens.length, 0)
  );

  readonly totalOk = computed(() =>
    this.checklist.reduce(
      (total, grupo) => total + grupo.itens.filter((item) => item.status === 'OK').length,
      0
    )
  );

  readonly totalValidar = computed(() => this.totalItens() - this.totalOk());

  classeBorda(cor: ChecklistGroup['cor']): string {
    return `release-card-${cor}`;
  }

  classeStatus(status: ChecklistItem['status']): string {
    return status === 'OK'
      ? 'badge text-bg-success'
      : 'badge text-bg-warning';
  }
}
