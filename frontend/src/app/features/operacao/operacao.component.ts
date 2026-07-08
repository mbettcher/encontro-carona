import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { OperacaoService } from './operacao.service';

@Component({
  standalone: true,
  selector: 'app-operacao',
  imports: [CommonModule],
  templateUrl: './operacao.component.html',
  styleUrl: './operacao.component.scss'
})
export class OperacaoComponent {
  private readonly operacaoService = inject(OperacaoService);

  itens = this.operacaoService.obterItens();
}
