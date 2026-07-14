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
          detalhe: 'Login autenticado, token enviado no Authorization Bearer e logout validado.'
        },
        {
          label: 'Sessão expirada',
          status: 'OK',
          detalhe: 'Token expirado limpa sessão e redireciona para a tela de login.'
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
        },
        {
          label: 'Refresh token',
          status: 'VALIDAR',
          detalhe: 'Pós-release: implementar refresh token com rotação para operações longas.'
        }
      ]
    },
    {
      titulo: 'Cadastros base',
      icon: 'fa-solid fa-database',
      cor: 'success',
      itens: [
        {
          label: 'Paróquias',
          status: 'OK',
          detalhe: 'Cadastro, listagem, edição e filtro visual revisados.'
        },
        {
          label: 'Pessoas',
          status: 'OK',
          detalhe: 'Cadastro de Tios Carona e Encontristas com busca textual e data formatada.'
        },
        {
          label: 'Eventos',
          status: 'OK',
          detalhe: 'Cadastro, edição de status, listagem e filtro visual revisados.'
        },
        {
          label: 'Usuários do sistema',
          status: 'OK',
          detalhe: 'Tela administrativa disponível somente para ADMIN.'
        }
      ]
    },
    {
      titulo: 'Evento',
      icon: 'fa-solid fa-people-group',
      cor: 'info',
      itens: [
        {
          label: 'Gestão do Evento',
          status: 'OK',
          detalhe: 'Tios, duplas, encontristas e vínculos com cards e permissões revisados.'
        },
        {
          label: 'Credenciais',
          status: 'OK',
          detalhe: 'Geração, filtros, ações por status, reemissão e impressão validadas.'
        },
        {
          label: 'Operação',
          status: 'OK',
          detalhe: 'Check-in/check-out, presença, visão geral e listas de presença validadas.'
        },
        {
          label: 'Caderno de Mensagens',
          status: 'OK',
          detalhe: 'Fluxo operacional e timeline horizontal normalizados.'
        }
      ]
    },
    {
      titulo: 'Impressões e visual',
      icon: 'fa-solid fa-print',
      cor: 'warning',
      itens: [
        {
          label: 'Crachás e QR Codes',
          status: 'OK',
          detalhe: 'Impressões revisadas com cabeçalho e quebras de página ajustadas.'
        },
        {
          label: 'Listas de presença',
          status: 'OK',
          detalhe: 'Impressão somente de participantes ativos.'
        },
        {
          label: 'Dashboard',
          status: 'OK',
          detalhe: 'Cards limpos, fonte local e visual menos colorido aplicados.'
        },
        {
          label: 'Layout principal',
          status: 'OK',
          detalhe: 'Layout componentizado com sidebar, navbar e footer.'
        },
        {
          label: 'PrimeNG Sidebar/Layout',
          status: 'VALIDAR',
          detalhe: 'Pós-release: avaliar migração para componente oficial quando a versão instalada suportar.'
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
