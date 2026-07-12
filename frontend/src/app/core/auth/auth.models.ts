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
  tokenType: 'Bearer' | string;
  expiresIn: number;
  usuario: UsuarioLogado;
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
