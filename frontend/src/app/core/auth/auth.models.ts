export type PerfilUsuario =
  | 'ADMIN'
  | 'OPERADOR_ADMIN'
  | 'OPERADOR_LEITURA'
  | 'SOMENTE_LEITURA';

export interface UsuarioLogado {
  id: number;
  nome: string;
  username: string;
  perfil: PerfilUsuario;
  perfilDescricao: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer' | string;
  expiresIn: number;
  usuario: UsuarioLogado;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface AlterarSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
  confirmacaoSenha: string;
}

export const TODOS_PERFIS: PerfilUsuario[] = [
  'ADMIN',
  'OPERADOR_ADMIN',
  'OPERADOR_LEITURA',
  'SOMENTE_LEITURA'
];

export const PERFIS_ESCRITA: PerfilUsuario[] = [
  'ADMIN',
  'OPERADOR_ADMIN'
];

export const PERFIS_CADASTROS: PerfilUsuario[] = [
  'ADMIN',
  'OPERADOR_ADMIN',
  'OPERADOR_LEITURA'
];

export const PERFIS_OPERACAO: PerfilUsuario[] = [
  'ADMIN',
  'OPERADOR_ADMIN',
  'OPERADOR_LEITURA'
];

export const PERFIS_IMPRESSAO: PerfilUsuario[] = [
  'ADMIN',
  'OPERADOR_ADMIN',
  'OPERADOR_LEITURA',
  'SOMENTE_LEITURA'
];

export const PERFIS_ADMIN: PerfilUsuario[] = [
  'ADMIN'
];