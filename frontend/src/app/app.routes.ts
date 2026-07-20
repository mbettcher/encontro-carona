import { Routes } from '@angular/router';

import { LayoutComponent } from './layout/layout.component';

import { DashboardComponent } from './features/dashboard/dashboard.component';
import { EventoGestaoComponent } from './features/evento-gestao/evento-gestao.component';
import { EventoOperacaoComponent } from './features/evento-operacao/evento-operacao.component';
import { EventosComponent } from './features/eventos/eventos.component';
import { OperacaoComponent } from './features/operacao/operacao.component';
import { ParoquiasComponent } from './features/paroquias/paroquias.component';
import { PessoasComponent } from './features/pessoas/pessoas.component';
import { EventoCredenciaisComponent } from './features/evento-credenciais/evento-credenciais.component';
import { LoginComponent } from './features/auth/login.component';
import { UsuariosSistemaComponent } from './features/usuarios-sistema/usuarios-sistema.component';
import { AlterarSenhaComponent } from './features/minha-conta/alterar-senha.component';
import { SobreVersaoComponent } from './features/sobre-versao/sobre-versao.component';

import { authGuard } from './core/auth/auth.guard';
import {
  PERFIS_ADMIN,
  PERFIS_CADASTROS,
  PERFIS_IMPRESSAO,
  PERFIS_OPERACAO,
  TODOS_PERFIS
} from './core/auth/auth.models';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    data: { perfis: TODOS_PERFIS },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [authGuard],
        data: { perfis: TODOS_PERFIS }
      },
      {
        path: 'minha-conta/alterar-senha',
        component: AlterarSenhaComponent,
        canActivate: [authGuard],
        data: { perfis: TODOS_PERFIS }
      },
      {
        path: 'sobre-versao',
        component: SobreVersaoComponent,
        canActivate: [authGuard],
        data: { perfis: TODOS_PERFIS }
      },

      {
        path: 'paroquias',
        component: ParoquiasComponent,
        canActivate: [authGuard],
        data: { perfis: PERFIS_CADASTROS }
      },
      {
        path: 'eventos',
        component: EventosComponent,
        canActivate: [authGuard],
        data: { perfis: PERFIS_CADASTROS }
      },
      {
        path: 'eventos/:eventoId/gestao',
        component: EventoGestaoComponent,
        canActivate: [authGuard],
        data: { perfis: PERFIS_CADASTROS }
      },
      {
        path: 'eventos/:eventoId/operacao',
        component: EventoOperacaoComponent,
        canActivate: [authGuard],
        data: { perfis: PERFIS_OPERACAO }
      },
      {
        path: 'eventos/:eventoId/credenciais',
        component: EventoCredenciaisComponent,
        canActivate: [authGuard],
        data: { perfis: PERFIS_IMPRESSAO }
      },
      {
        path: 'pessoas',
        component: PessoasComponent,
        canActivate: [authGuard],
        data: { perfis: PERFIS_CADASTROS }
      },
      {
        path: 'administracao/usuarios',
        component: UsuariosSistemaComponent,
        canActivate: [authGuard],
        data: { perfis: PERFIS_ADMIN }
      },
      {
        path: 'operacao',
        component: OperacaoComponent,
        canActivate: [authGuard],
        data: { perfis: PERFIS_OPERACAO }
      }
    ]
  },

  { path: '**', redirectTo: 'dashboard' }
];
