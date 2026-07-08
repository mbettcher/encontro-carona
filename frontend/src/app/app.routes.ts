import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { EventoGestaoComponent } from './features/evento-gestao/evento-gestao.component';
import { EventoOperacaoComponent } from './features/evento-operacao/evento-operacao.component';
import { EventosComponent } from './features/eventos/eventos.component';
import { OperacaoComponent } from './features/operacao/operacao.component';
import { ParoquiasComponent } from './features/paroquias/paroquias.component';
import { PessoasComponent } from './features/pessoas/pessoas.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'paroquias', component: ParoquiasComponent },
  { path: 'eventos', component: EventosComponent },
  { path: 'eventos/:eventoId/gestao', component: EventoGestaoComponent },
  { path: 'eventos/:eventoId/operacao', component: EventoOperacaoComponent },
  { path: 'pessoas', component: PessoasComponent },
  { path: 'operacao', component: OperacaoComponent },
  { path: '**', redirectTo: 'dashboard' }
];
