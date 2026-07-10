import { Directive, ElementRef, HostListener, Input, Optional, Self, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: 'input[appNumericOnly]',
  standalone: true
})
export class NumericOnlyDirective {
  private readonly elementRef = inject<ElementRef<HTMLInputElement>>(ElementRef);

  @Input() appNumericOnlyMaxLength?: number | string;

  constructor(@Optional() @Self() private readonly ngControl: NgControl | null) {}

  @HostListener('input')
  aoDigitar(): void {
    this.aplicarSomenteNumeros();
  }

  @HostListener('blur')
  aoSair(): void {
    this.aplicarSomenteNumeros();
  }

  private aplicarSomenteNumeros(): void {
    const input = this.elementRef.nativeElement;
    const maxLength = Number(this.appNumericOnlyMaxLength || 0);

    let valor = String(input.value ?? '').replace(/\D/g, '');

    if (maxLength > 0) {
      valor = valor.slice(0, maxLength);
    }

    if (input.value !== valor) {
      input.value = valor;
    }

    const control = this.ngControl?.control;

    if (control && control.value !== valor) {
      control.setValue(valor, { emitEvent: false });
    }
  }
}
