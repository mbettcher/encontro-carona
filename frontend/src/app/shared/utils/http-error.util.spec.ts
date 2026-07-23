import { HttpErrorResponse } from '@angular/common/http';
import { extrairMensagemErro } from './http-error.util';

describe('extrairMensagemErro', () => {
  it('deve combinar mensagem principal e detalhes de validação', () => {
    const erro = new HttpErrorResponse({
      status: 400,
      error: {
        message: 'Dados inválidos.',
        details: [
          'responsavelNome: deve ser informado',
          'endereco: tamanho máximo excedido'
        ]
      }
    });

    expect(extrairMensagemErro(erro, 'Falha')).toBe(
      'Dados inválidos. responsavelNome: deve ser informado endereco: tamanho máximo excedido'
    );
  });

  it('deve usar mensagem de negócio do backend', () => {
    const erro = new HttpErrorResponse({
      status: 422,
      error: {
        message: 'Esta pessoa já está cadastrada como encontrista neste evento.'
      }
    });

    expect(extrairMensagemErro(erro, 'Falha')).toBe(
      'Esta pessoa já está cadastrada como encontrista neste evento.'
    );
  });

  it('deve tratar erro de conexão', () => {
    const erro = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error'
    });

    expect(extrairMensagemErro(erro)).toContain(
      'Não foi possível conectar à API'
    );
  });

  it('deve retornar fallback para erro desconhecido', () => {
    expect(extrairMensagemErro(new Error('erro'), 'Mensagem padrão'))
      .toBe('Mensagem padrão');
  });
});
