import { Injectable } from '@angular/core';

export type QrFeedbackTipo = 'SUCESSO' | 'ATENCAO' | 'ERRO';

@Injectable({
  providedIn: 'root'
})
export class QrOperationalFeedbackService {
  private audioContext: AudioContext | null = null;

  preparar(): void {
    const contexto = this.obterAudioContext();

    if (!contexto) {
      return;
    }

    if (contexto.state === 'suspended') {
      void contexto.resume();
    }
  }

  emitir(tipo: QrFeedbackTipo): void {
    this.emitirVibracao(tipo);
    this.emitirSom(tipo);
  }

  private emitirSom(tipo: QrFeedbackTipo): void {
    const contexto = this.obterAudioContext();

    if (!contexto) {
      return;
    }

    if (contexto.state === 'suspended') {
      void contexto.resume();
    }

    const agora = contexto.currentTime;

    switch (tipo) {
      case 'SUCESSO':
        this.tocarTom(contexto, 880, agora, 0.09, 0.12);
        this.tocarTom(contexto, 1175, agora + 0.1, 0.12, 0.1);
        break;

      case 'ATENCAO':
        this.tocarTom(contexto, 660, agora, 0.12, 0.11);
        this.tocarTom(contexto, 520, agora + 0.13, 0.14, 0.1);
        break;

      case 'ERRO':
        this.tocarTom(contexto, 260, agora, 0.16, 0.13);
        this.tocarTom(contexto, 190, agora + 0.17, 0.2, 0.12);
        break;
    }
  }

  private tocarTom(
    contexto: AudioContext,
    frequencia: number,
    inicio: number,
    duracao: number,
    volume: number
  ): void {
    const oscilador = contexto.createOscillator();
    const ganho = contexto.createGain();

    oscilador.type = 'sine';
    oscilador.frequency.setValueAtTime(frequencia, inicio);

    ganho.gain.setValueAtTime(0.0001, inicio);
    ganho.gain.exponentialRampToValueAtTime(volume, inicio + 0.01);
    ganho.gain.exponentialRampToValueAtTime(
      0.0001,
      inicio + duracao
    );

    oscilador.connect(ganho);
    ganho.connect(contexto.destination);

    oscilador.start(inicio);
    oscilador.stop(inicio + duracao + 0.02);
  }

  private emitirVibracao(tipo: QrFeedbackTipo): void {
    if (
      typeof navigator === 'undefined' ||
      typeof navigator.vibrate !== 'function'
    ) {
      return;
    }

    switch (tipo) {
      case 'SUCESSO':
        navigator.vibrate(80);
        break;
      case 'ATENCAO':
        navigator.vibrate([90, 60, 90]);
        break;
      case 'ERRO':
        navigator.vibrate([160, 80, 160]);
        break;
    }
  }

  private obterAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }

    if (this.audioContext) {
      return this.audioContext;
    }

    const construtor =
      window.AudioContext ??
      (
        window as Window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!construtor) {
      return null;
    }

    this.audioContext = new construtor();
    return this.audioContext;
  }
}
