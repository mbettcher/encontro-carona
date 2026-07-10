import { Directive, ElementRef, HostListener, Optional, Self, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: 'input[appTelefoneMask]',
  standalone: true
})
export class TelefoneMaskDirective {
  private readonly elementRef = inject<ElementRef<HTMLInputElement>>(ElementRef);

  constructor(@Optional() @Self() private readonly ngControl: NgControl | null) {}

  @HostListener('input')
  aoDigitar(): void {
    this.aplicarMascara();
  }

  @HostListener('blur')
  aoSair(): void {
    this.aplicarMascara();
  }

  private aplicarMascara(): void {
    const input = this.elementRef.nativeElement;
    const valorFormatado = TelefoneMaskDirective.formatar(input.value);

    if (input.value !== valorFormatado) {
      input.value = valorFormatado;
    }

    const control = this.ngControl?.control;

    if (control && control.value !== valorFormatado) {
      control.setValue(valorFormatado, { emitEvent: false });
    }
  }

  static formatar(valor: string | number | null | undefined): string {
    const digitos = String(valor ?? '').replace(/\D/g, '').slice(0, 11);

    if (!digitos) {
      return '';
    }

    if (digitos.length <= 2) {
      return `(${digitos}`;
    }

    const ddd = digitos.slice(0, 2);
    const numero = digitos.slice(2);

    if (numero.length <= 4) {
      return `(${ddd}) ${numero}`;
    }

    if (digitos.length <= 10) {
      return `(${ddd}) ${numero.slice(0, 4)}-${numero.slice(4)}`;
    }

    return `(${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`;
  }
}
