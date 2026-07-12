import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { EventoGestaoComponent } from './features/evento-gestao/evento-gestao.component';
import { EventoOperacaoComponent } from './features/evento-operacao/evento-operacao.component';
import { EventosComponent } from './features/eventos/eventos.component';
import { OperacaoComponent } from './features/operacao/operacao.component';
import { ParoquiasComponent } from './features/paroquias/paroquias.component';
import { PessoasComponent } from './features/pessoas/pessoas.component';
import { EventoCredenciaisComponent } from './features/evento-credenciais/evento-credenciais.component';
import { EventoQrCodePrintComponent } from './features/evento-credenciais/evento-qrcode-print.component';
import { EventoCrachaPrintComponent } from './features/evento-credenciais/evento-cracha-print.component';
import { EventoListaPresencaPrintComponent } from './features/evento-operacao/evento-lista-presenca-print.component';
import { LoginComponent } from './features/auth/login.component';
import { authGuard } from './core/auth/auth.guard';
import { TODOS_PERFIS } from './core/auth/auth.models';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard], data: { perfis: TODOS_PERFIS } },
  { path: 'paroquias', component: ParoquiasComponent, canActivate: [authGuard], data: { perfis: TODOS_PERFIS } },
  { path: 'eventos', component: EventosComponent, canActivate: [authGuard], data: { perfis: TODOS_PERFIS } },
  { path: 'eventos/:eventoId/gestao', component: EventoGestaoComponent, canActivate: [authGuard], data: { perfis: TODOS_PERFIS } },
  { path: 'eventos/:eventoId/operacao', component: EventoOperacaoComponent, canActivate: [authGuard], data: { perfis: TODOS_PERFIS } },
  { path: 'eventos/:eventoId/operacao/impressao-presenca', component: EventoListaPresencaPrintComponent, canActivate: [authGuard], data: { perfis: TODOS_PERFIS } },
  { path: 'eventos/:eventoId/credenciais', component: EventoCredenciaisComponent, canActivate: [authGuard], data: { perfis: TODOS_PERFIS } },
  { path: 'eventos/:eventoId/credenciais/impressao-qrcode', component: EventoQrCodePrintComponent, canActivate: [authGuard], data: { perfis: TODOS_PERFIS } },
  { path: 'eventos/:eventoId/credenciais/impressao-crachas', component: EventoCrachaPrintComponent, canActivate: [authGuard], data: { perfis: TODOS_PERFIS } },
  { path: 'pessoas', component: PessoasComponent, canActivate: [authGuard], data: { perfis: TODOS_PERFIS } },
  { path: 'operacao', component: OperacaoComponent, canActivate: [authGuard], data: { perfis: TODOS_PERFIS } },

  { path: '**', redirectTo: 'dashboard' }
];
