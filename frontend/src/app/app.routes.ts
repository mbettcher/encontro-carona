import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ParoquiaListComponent } from './features/paroquias/paroquia-list.component';
import { EventoListComponent } from './features/eventos/evento-list.component';
import { PessoaListComponent } from './features/pessoas/pessoa-list.component';
import { OperacaoComponent } from './features/operacao/operacao.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'paroquias', component: ParoquiaListComponent },
  { path: 'eventos', component: EventoListComponent },
  { path: 'pessoas', component: PessoaListComponent },
  { path: 'operacao', component: OperacaoComponent }
];
