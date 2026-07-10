import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class CustomFormHelperService {
  private readonly palavrasIgnoradasCodigo = new Set([
    'A', 'AS', 'O', 'OS', 'E',
    'DE', 'DA', 'DAS', 'DO', 'DOS',
    'EM', 'NO', 'NA', 'NOS', 'NAS',
    'COM', 'POR', 'PARA', 'AO', 'AOS',
    'UM', 'UMA', 'UNS', 'UMAS'
  ]);

  private readonly preposicoes = new Set([
    'de', 'da', 'do', 'das', 'dos',
    'em', 'no', 'na', 'nos', 'nas',
    'por', 'a', 'e', 'para', 'ao', 'aos',
    'com'
  ]);

  titleCaseCustom(texto: string): string {
    const normalizado = String(texto ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();

    if (!normalizado) {
      return '';
    }

    return normalizado
      .split(' ')
      .map((palavra, index) => {
        if (index > 0 && this.preposicoes.has(palavra)) {
          return palavra;
        }

        return palavra
          .split('-')
          .map(parte => this.capitalizarParte(parte))
          .join('-');
      })
      .join(' ');
  }

  formatarCamposComTitleCase(form: FormGroup, campos: string[]): void {
    campos.forEach(campo => {
      const control = form.get(campo);

      if (control && typeof control.value === 'string') {
        const valorFormatado = this.titleCaseCustom(control.value);
        control.setValue(valorFormatado, { emitEvent: false });
      }
    });
  }

  apenasNumeros(control: AbstractControl | null | undefined, maxLength = 4): void {
    if (!control) {
      return;
    }

    const valor = String(control.value ?? '');
    const apenasNumeros = valor.replace(/[^0-9]/g, '').slice(0, maxLength);
    control.setValue(apenasNumeros, { emitEvent: false });
  }

  preencherZerosEsquerda(control: AbstractControl | null | undefined, totalLength = 4): void {
    if (!control) {
      return;
    }

    const valor = String(control.value ?? '');
    const padded = valor.padStart(totalLength, '0');
    control.setValue(padded, { emitEvent: false });
  }

  gerarCodigoDoNome(nome: string): string {
    const nomeInformado = String(nome ?? '').trim();

    if (!nomeInformado) {
      return '';
    }

    const semAcentos = nomeInformado
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const tokens = semAcentos
      .toUpperCase()
      .split(/[^A-Z0-9]+/)
      .map(token => token.trim())
      .filter(token => !!token)
      .filter(token => !this.palavrasIgnoradasCodigo.has(token));

    return this.sanitizarCodigo(tokens.join('_'));
  }

  sanitizarCodigo(valor: string): string {
    return String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9_\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .trim();
  }

  private capitalizarParte(parte: string): string {
    if (!parte) {
      return '';
    }

    return parte.charAt(0).toUpperCase() + parte.slice(1);
  }
}
