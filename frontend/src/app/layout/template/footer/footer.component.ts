import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  readonly anoAtual = signal(new Date().getFullYear());
  readonly textoVersao = computed(() => `EAC - Tio Carona v1.0.0`);
}
