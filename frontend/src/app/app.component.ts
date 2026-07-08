import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="d-flex ec-shell">
      <aside class="ec-sidebar p-3 d-none d-lg-block">
        <h1 class="h5 mb-4"><i class="fa-solid fa-van-shuttle me-2"></i>Encontro Carona</h1>
        <nav class="d-grid gap-2">
          <a routerLink="/dashboard"><i class="fa-solid fa-chart-line me-2"></i>Dashboard</a>
          <a routerLink="/paroquias"><i class="fa-solid fa-church me-2"></i>Paróquias</a>
          <a routerLink="/eventos"><i class="fa-solid fa-calendar-days me-2"></i>Eventos</a>
          <a routerLink="/pessoas"><i class="fa-solid fa-users me-2"></i>Pessoas</a>
          <a routerLink="/operacao"><i class="fa-solid fa-qrcode me-2"></i>Operação</a>
        </nav>
      </aside>

      <main class="flex-fill">
        <header class="bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
          <div>
            <strong>Aplicativo do Encontro</strong>
            <div class="small text-muted">Cadastro, caronas, check-in e operação do evento</div>
          </div>
          <span class="badge text-bg-success">MVP 1</span>
        </header>
        <section class="container-fluid p-4">
          <router-outlet />
        </section>
      </main>
    </div>
  `
})
export class AppComponent {}
