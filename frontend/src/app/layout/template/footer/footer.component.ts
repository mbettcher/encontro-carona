import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_BUILD_INFO } from 'src/app/core/app-version';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  readonly buildInfo = APP_BUILD_INFO;
  
  readonly anoAtual = signal(new Date().getFullYear());
  readonly textoVersao = computed(() => `EAC - Tio Carona v${this.buildInfo.version}`);
}
