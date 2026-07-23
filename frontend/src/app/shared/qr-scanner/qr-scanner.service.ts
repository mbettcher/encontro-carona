import { ElementRef, Injectable } from '@angular/core';
import {
  BrowserQRCodeReader,
  IScannerControls
} from '@zxing/browser';

import {
  QrCameraOption,
  QrScannerErro
} from './qr-scanner.models';

@Injectable({
  providedIn: 'root'
})
export class QrScannerService {
  private reader: BrowserQRCodeReader | null = null;
  private controls: IScannerControls | null = null;
  private video: HTMLVideoElement | null = null;

  suporteDisponivel(): boolean {
    return Boolean(
      navigator.mediaDevices?.getUserMedia &&
      window.isSecureContext
    );
  }

  async iniciar(
    videoRef: ElementRef<HTMLVideoElement>,
    aoLer: (texto: string) => void,
    aoFalhar: (erro: QrScannerErro) => void,
    deviceId?: string | null
  ): Promise<void> {
    this.parar();

    if (!window.isSecureContext) {
      aoFalhar({
        estado: 'INDISPONIVEL',
        mensagem:
          'A câmera exige HTTPS. Em desenvolvimento, use localhost ou um endereço HTTPS.'
      });
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      aoFalhar({
        estado: 'INDISPONIVEL',
        mensagem: 'Este navegador não oferece acesso compatível à câmera.'
      });
      return;
    }

    this.reader = new BrowserQRCodeReader();
    this.video = videoRef.nativeElement;

    try {
      const callback = (
        resultado: { getText(): string } | undefined,
        erro: unknown
      ): void => {
        if (resultado) {
          const texto = resultado.getText().trim();

          if (texto) {
            aoLer(texto);
          }

          return;
        }

        if (this.erroIgnoravelDeLeitura(erro)) {
          return;
        }

        if (erro) {
          console.warn('Falha durante leitura do QR Code:', erro);
        }
      };

      this.controls = deviceId
        ? await this.reader.decodeFromVideoDevice(
            deviceId,
            this.video,
            callback
          )
        : await this.reader.decodeFromConstraints(
            {
              audio: false,
              video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
            },
            this.video,
            callback
          );
    } catch (erro) {
      this.parar();
      aoFalhar(this.normalizarErro(erro));
    }
  }

  async listarCameras(): Promise<QrCameraOption[]> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return [];
    }

    const dispositivos = await navigator.mediaDevices.enumerateDevices();

    return dispositivos
      .filter(dispositivo => dispositivo.kind === 'videoinput')
      .map((dispositivo, indice) => ({
        deviceId: dispositivo.deviceId,
        label: dispositivo.label || `Câmera ${indice + 1}`
      }));
  }

  pausar(): void {
    this.controls?.stop();
    this.controls = null;
  }

  parar(): void {
    this.controls?.stop();
    this.controls = null;
    this.reader = null;

    const stream = this.video?.srcObject;

    if (stream instanceof MediaStream) {
      stream.getTracks().forEach(track => track.stop());
    }

    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
      this.video.removeAttribute('src');
      this.video.load();
    }

    this.video = null;
  }

  private erroIgnoravelDeLeitura(erro: unknown): boolean {
    if (!erro || typeof erro !== 'object') {
      return false;
    }

    const nome = 'name' in erro ? String(erro.name) : '';

    return [
      'NotFoundException',
      'ChecksumException',
      'FormatException'
    ].includes(nome);
  }

  private normalizarErro(erro: unknown): QrScannerErro {
    const nome =
      erro && typeof erro === 'object' && 'name' in erro
        ? String(erro.name)
        : '';

    if (
      nome === 'NotAllowedError' ||
      nome === 'PermissionDeniedError'
    ) {
      return {
        estado: 'PERMISSAO_NEGADA',
        mensagem:
          'A permissão da câmera foi negada. Libere o acesso nas configurações do navegador.'
      };
    }

    if (
      nome === 'NotFoundError' ||
      nome === 'DevicesNotFoundError'
    ) {
      return {
        estado: 'INDISPONIVEL',
        mensagem: 'Nenhuma câmera foi encontrada neste dispositivo.'
      };
    }

    if (
      nome === 'NotReadableError' ||
      nome === 'TrackStartError'
    ) {
      return {
        estado: 'INDISPONIVEL',
        mensagem:
          'A câmera está sendo usada por outro aplicativo ou não pôde ser iniciada.'
      };
    }

    if (nome === 'OverconstrainedError') {
      return {
        estado: 'INDISPONIVEL',
        mensagem:
          'A câmera disponível não atende às configurações solicitadas.'
      };
    }

    return {
      estado: 'ERRO',
      mensagem: 'Não foi possível iniciar a leitura pela câmera.'
    };
  }
}
