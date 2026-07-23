import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  input,
  output,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import {
  QrCameraOption,
  QrCodeLeitura,
  QrScannerEstado,
  QrScannerErro
} from './qr-scanner.models';
import { QrScannerService } from './qr-scanner.service';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule
  ],
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.scss']
})
export class QrScannerComponent
  implements AfterViewInit, OnDestroy {

  @ViewChild('videoElement')
  private videoElement?: ElementRef<HTMLVideoElement>;

  readonly ativo = input(true);
  readonly bloqueado = input(false);
  readonly titulo = input('Leitor de QR Code');
  readonly permitirDigitacaoManual = input(true);
  readonly tempoBloqueioMesmoCodigoMs = input(2500);

  readonly qrCodeLido = output<QrCodeLeitura>();
  readonly erroScanner = output<QrScannerErro>();
  readonly estadoAlterado = output<QrScannerEstado>();

  readonly estado = signal<QrScannerEstado>('INATIVO');
  readonly mensagem = signal('Preparando leitor...');
  readonly cameras = signal<QrCameraOption[]>([]);
  readonly cameraSelecionadaId = signal<string | null>(null);
  readonly codigoManual = signal('');
  readonly ultimoCodigo = signal<string | null>(null);
  readonly ultimaLeituraEm = signal<number>(0);

  readonly pronto = computed(
    () => this.estado() === 'PRONTO' && !this.bloqueado()
  );

  readonly processando = computed(
    () =>
      this.estado() === 'INICIANDO' ||
      this.estado() === 'PROCESSANDO'
  );

  readonly classeEstado = computed(() => {
    switch (this.estado()) {
      case 'PRONTO':
        return 'estado-pronto';
      case 'PROCESSANDO':
        return 'estado-processando';
      case 'PERMISSAO_NEGADA':
      case 'INDISPONIVEL':
      case 'ERRO':
        return 'estado-erro';
      case 'PAUSADO':
        return 'estado-pausado';
      default:
        return 'estado-inativo';
    }
  });

  private viewInicializada = false;
  private reinicioTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly scannerService: QrScannerService
  ) {
    effect(() => {
      const deveEstarAtivo = this.ativo();
      const bloqueado = this.bloqueado();

      if (!this.viewInicializada) {
        return;
      }

      if (!deveEstarAtivo) {
        this.parar();
        return;
      }

      if (bloqueado) {
        this.atualizarEstado(
          'PAUSADO',
          'Aguardando a conclusão da operação...'
        );
        return;
      }

      if (
        this.estado() === 'INATIVO' ||
        this.estado() === 'PAUSADO'
      ) {
        void this.iniciar();
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewInicializada = true;

    if (this.ativo()) {
      void this.iniciar();
    }
  }

  ngOnDestroy(): void {
    this.cancelarReinicio();
    this.scannerService.parar();
  }

  async iniciar(): Promise<void> {
    if (!this.videoElement || this.processando()) {
      return;
    }

    this.cancelarReinicio();
    this.atualizarEstado(
      'INICIANDO',
      'Solicitando acesso à câmera...'
    );

    await this.scannerService.iniciar(
      this.videoElement,
      texto => this.receberCodigo(texto, 'CAMERA'),
      erro => this.tratarErro(erro),
      this.cameraSelecionadaId()
    );

    if (
      this.estado() !== 'PERMISSAO_NEGADA' &&
      this.estado() !== 'INDISPONIVEL' &&
      this.estado() !== 'ERRO'
    ) {
      await this.atualizarCameras();
      this.atualizarEstado(
        'PRONTO',
        'Aponte a câmera para o QR Code.'
      );
    }
  }

  parar(): void {
    this.cancelarReinicio();
    this.scannerService.parar();
    this.atualizarEstado('INATIVO', 'Leitor desligado.');
  }

  async trocarCamera(deviceId: string | null): Promise<void> {
    this.cameraSelecionadaId.set(deviceId);

    if (this.ativo()) {
      await this.iniciar();
    }
  }

  registrarCodigoManual(): void {
    const texto = this.codigoManual().trim();

    if (!texto || this.bloqueado()) {
      return;
    }

    this.codigoManual.set('');
    this.receberCodigo(texto, 'MANUAL');
  }

  rearmarAgora(): void {
    this.cancelarReinicio();
    this.ultimoCodigo.set(null);
    this.ultimaLeituraEm.set(0);

    if (this.ativo() && !this.bloqueado()) {
      this.atualizarEstado(
        'PRONTO',
        'Pronto para a próxima leitura.'
      );
    }
  }

  private receberCodigo(
    texto: string,
    origem: QrCodeLeitura['origem']
  ): void {
    if (
      !this.ativo() ||
      this.bloqueado() ||
      this.estado() === 'PROCESSANDO'
    ) {
      return;
    }

    const agora = Date.now();
    const repetido =
      this.ultimoCodigo() === texto &&
      agora - this.ultimaLeituraEm() <
        this.tempoBloqueioMesmoCodigoMs();

    if (repetido) {
      return;
    }

    this.ultimoCodigo.set(texto);
    this.ultimaLeituraEm.set(agora);
    this.atualizarEstado(
      'PROCESSANDO',
      'QR Code identificado. Processando...'
    );

    this.qrCodeLido.emit({
      texto,
      lidoEm: new Date(),
      origem
    });

    this.agendarReinicio();
  }

  private agendarReinicio(): void {
    this.cancelarReinicio();

    this.reinicioTimer = setTimeout(() => {
      if (this.ativo() && !this.bloqueado()) {
        this.atualizarEstado(
          'PRONTO',
          'Pronto para a próxima leitura.'
        );
      }
    }, this.tempoBloqueioMesmoCodigoMs());
  }

  private async atualizarCameras(): Promise<void> {
    try {
      const cameras = await this.scannerService.listarCameras();
      this.cameras.set(cameras);

      if (!this.cameraSelecionadaId() && cameras.length > 0) {
        const traseira =
          cameras.find(camera =>
            /back|rear|environment|traseira/i.test(camera.label)
          ) ?? cameras[0];

        this.cameraSelecionadaId.set(traseira.deviceId);
      }
    } catch {
      this.cameras.set([]);
    }
  }

  private tratarErro(erro: QrScannerErro): void {
    this.atualizarEstado(erro.estado, erro.mensagem);
    this.erroScanner.emit(erro);
  }

  private atualizarEstado(
    estado: QrScannerEstado,
    mensagem: string
  ): void {
    this.estado.set(estado);
    this.mensagem.set(mensagem);
    this.estadoAlterado.emit(estado);
  }

  private cancelarReinicio(): void {
    if (this.reinicioTimer) {
      clearTimeout(this.reinicioTimer);
      this.reinicioTimer = null;
    }
  }
}
