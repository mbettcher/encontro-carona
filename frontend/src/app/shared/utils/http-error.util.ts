import { HttpErrorResponse } from '@angular/common/http';

export function extrairMensagemErro(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error;
    if (body?.message) return body.message;
    if (body?.erro) return body.erro;
    if (typeof body === 'string' && body.trim()) return body;
    if (error.status === 0) return 'Não foi possível conectar à API. Confira se o backend está rodando.';
    return `Erro ${error.status}: ${error.statusText || 'falha na operação.'}`;
  }

  return 'Não foi possível concluir a operação.';
}
