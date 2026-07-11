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

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'paroquias', component: ParoquiasComponent },
  { path: 'eventos', component: EventosComponent },
  { path: 'eventos/:eventoId/gestao', component: EventoGestaoComponent },
  { path: 'eventos/:eventoId/operacao', component: EventoOperacaoComponent },
  { path: 'eventos/:eventoId/operacao/impressao-presenca', component: EventoListaPresencaPrintComponent },
  { path: 'eventos/:eventoId/credenciais', component: EventoCredenciaisComponent},
  { path: 'eventos/:eventoId/credenciais/impressao-qrcode', component: EventoQrCodePrintComponent},
  { path: 'eventos/:eventoId/credenciais/impressao-crachas', component: EventoCrachaPrintComponent},
  { path: 'pessoas', component: PessoasComponent },
  { path: 'operacao', component: OperacaoComponent },
  { path: '**', redirectTo: 'dashboard' }
];