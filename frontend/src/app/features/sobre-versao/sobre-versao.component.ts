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
      titulo: 'Segurança e acesso',
      icon: 'fa-solid fa-shield-halved',
      cor: 'primary',
      itens: [
        {
          label: 'Login e JWT',
          status: 'OK',
          detalhe: 'Autenticação JWT, token Bearer, logout, troca de senha e expiração de sessão validados.'
        },
        {
          label: 'Perfis e permissões',
          status: 'OK',
          detalhe: 'ADMIN, OPERADOR_ADMIN, OPERADOR_LEITURA e SOMENTE_LEITURA aplicados em rotas, menus e ações.'
        },
        {
          label: 'Administração de usuários',
          status: 'OK',
          detalhe: 'Criação, alteração de perfil, ativação, desativação e redefinição de senha disponíveis ao ADMIN.'
        },
        {
          label: 'Tratamento de acesso',
          status: 'OK',
          detalhe: 'Respostas 401 e 403 tratadas sem derrubar indevidamente a navegação da aplicação.'
        }
      ]
    },
    {
      titulo: 'Gestão do evento',
      icon: 'fa-solid fa-calendar-check',
      cor: 'success',
      itens: [
        {
          label: 'Cadastros principais',
          status: 'OK',
          detalhe: 'Paróquias/Comunidades, pessoas, eventos, tios, duplas, encontristas e vínculos revisados.'
        },
        {
          label: 'Operação por credencial',
          status: 'OK',
          detalhe: 'Leitura QR e operação manual de tios e encontristas funcionando com validação de credencial ativa.'
        },
        {
          label: 'Presença e históricos',
          status: 'OK',
          detalhe: 'Históricos de check-in, checkout e presença por dia consolidados para a operação do evento.'
        },
        {
          label: 'Central de impressão',
          status: 'OK',
          detalhe: 'Credenciais, crachás, carteirinhas, etiquetas e relatórios Jasper mantidos e revisados.'
        }
      ]
    },
    {
      titulo: 'Caderno de Mensagens',
      icon: 'fa-solid fa-book-open',
      cor: 'info',
      itens: [
        {
          label: 'Seleção operacional',
          status: 'OK',
          detalhe: 'Entrega, recebimento e recolhimento trabalham com seleção explícita de cadernos da mesma dupla.'
        },
        {
          label: 'Timeline consolidada',
          status: 'OK',
          detalhe: 'Histórico cronológico por encontrista reúne todas as vias, movimentações, responsáveis e transições.'
        },
        {
          label: 'Ocorrências e recuperação',
          status: 'OK',
          detalhe: 'Perda, dano informativo ou impeditivo e recuperação da etapa anterior foram estruturados.'
        },
        {
          label: 'Versionamento e cancelamento',
          status: 'OK',
          detalhe: 'Substituição cria nova via; cancelamento registra motivo e controla recolhimento físico pendente.'
        }
      ]
    },
    {
      titulo: 'Qualidade da release',
      icon: 'fa-solid fa-circle-check',
      cor: 'warning',
      itens: [
        {
          label: 'Fluxos legados',
          status: 'OK',
          detalhe: 'Chamadas e endpoints antigos do Caderno de Mensagens foram removidos após homologação.'
        },
        {
          label: 'Validação dos formulários',
          status: 'OK',
          detalhe: 'Ações especiais exigem campos obrigatórios, bloqueiam envio duplicado e limpam o estado após sucesso.'
        },
        {
          label: 'Responsividade e UX',
          status: 'OK',
          detalhe: 'Tabelas, diálogos, timeline, alertas e estados desabilitados foram revisados para uso operacional.'
        },
        {
          label: 'Homologação',
          status: 'OK',
          detalhe: 'Frontend buildado, backend executado e principais cenários da versão 1.2.0 testados e aprovados.'
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
