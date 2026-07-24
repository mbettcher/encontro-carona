export type TipoCredencialQr = 'TIO_CARONA' | 'ENCONTRISTA';

export interface ValidacaoCredencialQr {
  valida: boolean;
  codigo: string;
  tipo?: TipoCredencialQr;
  mensagem?: string;
}

const PADRAO_CREDENCIAL =
  /^(TC|SB)-E\d{4,}-\d{6}(?:-R\d{2})?$/;

export function validarCredencialQr(
  valor: string | null | undefined
): ValidacaoCredencialQr {
  const codigo = String(valor ?? '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase();

  if (!codigo) {
    return {
      valida: false,
      codigo,
      mensagem: 'Informe uma credencial válida.'
    };
  }

  if (codigo.length > 80) {
    return {
      valida: false,
      codigo,
      mensagem:
        'O código da credencial ultrapassa o limite permitido.'
    };
  }

  if (!/^[A-Z0-9_-]+$/.test(codigo)) {
    return {
      valida: false,
      codigo,
      mensagem:
        'O código contém caracteres não permitidos.'
    };
  }

  const correspondencia = codigo.match(PADRAO_CREDENCIAL);

  if (!correspondencia) {
    return {
      valida: false,
      codigo,
      mensagem:
        'O conteúdo lido não possui o formato de uma credencial válida.'
    };
  }

  return {
    valida: true,
    codigo,
    tipo:
      correspondencia[1] === 'TC'
        ? 'TIO_CARONA'
        : 'ENCONTRISTA'
  };
}
