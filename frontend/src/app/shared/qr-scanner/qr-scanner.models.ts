export type QrScannerEstado =
  | 'INATIVO'
  | 'INICIANDO'
  | 'PRONTO'
  | 'PROCESSANDO'
  | 'PAUSADO'
  | 'PERMISSAO_NEGADA'
  | 'INDISPONIVEL'
  | 'ERRO';

export interface QrCameraOption {
  label: string;
  deviceId: string;
}

export interface QrCodeLeitura {
  texto: string;
  lidoEm: Date;
  origem: 'CAMERA' | 'MANUAL';
}

export interface QrScannerErro {
  estado: Extract<
    QrScannerEstado,
    'PERMISSAO_NEGADA' | 'INDISPONIVEL' | 'ERRO'
  >;
  mensagem: string;
}
