import { HttpErrorResponse } from '@angular/common/http';

interface ApiErrorBody {
  message?: unknown;
  detail?: unknown;
  title?: unknown;
  erro?: unknown;
  details?: unknown;
}

export function extrairMensagemErro(
  error: unknown,
  fallback = 'Não foi possível concluir a operação.'
): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  if (error.status === 0) {
    return 'Não foi possível conectar à API. Confira sua conexão e se o backend está disponível.';
  }

  const body = error.error;

  if (typeof body === 'string') {
    const texto = body.trim();
    return texto || fallback;
  }

  if (!body || typeof body !== 'object') {
    return mensagemPorStatus(error, fallback);
  }

  const apiError = body as ApiErrorBody;
  const mensagemPrincipal = primeiroTexto(
    apiError.message,
    apiError.detail,
    apiError.title,
    apiError.erro
  );
  const detalhes = normalizarDetalhes(apiError.details);

  if (mensagemPrincipal && detalhes.length > 0) {
    return `${mensagemPrincipal} ${detalhes.join(' ')}`;
  }

  if (detalhes.length > 0) {
    return detalhes.join(' ');
  }

  return mensagemPrincipal || mensagemPorStatus(error, fallback);
}

function primeiroTexto(...valores: unknown[]): string | undefined {
  for (const valor of valores) {
    if (typeof valor === 'string' && valor.trim()) {
      return valor.trim();
    }
  }

  return undefined;
}

function normalizarDetalhes(valor: unknown): string[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  return valor
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean);
}

function mensagemPorStatus(
  error: HttpErrorResponse,
  fallback: string
): string {
  switch (error.status) {
    case 400:
      return fallback;
    case 401:
      return 'Sua sessão não é mais válida. Entre novamente no sistema.';
    case 403:
      return 'Você não tem permissão para executar esta operação.';
    case 404:
      return 'O recurso solicitado não foi encontrado.';
    case 409:
      return 'A operação não pôde ser concluída por conflito com os dados atuais.';
    case 422:
      return fallback;
    case 500:
      return 'O servidor encontrou um erro inesperado. Tente novamente.';
    default:
      return error.status > 0
        ? `Erro ${error.status}: ${error.statusText || fallback}`
        : fallback;
  }
}
