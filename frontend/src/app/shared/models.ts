export type EventoStatus = 'PLANEJADO' | 'EM_ANDAMENTO' | 'ENCERRADO' | 'CANCELADO';
export type PessoaTipo = 'TIO_CARONA' | 'SOBRINHO' | 'RESPONSAVEL' | 'EQUIPE';
export type TioCaronaStatus = 'ATIVO' | 'INATIVO';
export type DuplaStatus = 'ATIVA' | 'INATIVA';
export type SobrinhoStatus = 'INSCRITO' | 'PRESENTE' | 'AUSENTE' | 'DESISTENTE';
export type VinculoStatus = 'ATIVO' | 'REMOVIDO';

export interface Paroquia {
  id: number;
  nome: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  telefone?: string;
  email?: string;
  responsavel?: string;
}

export interface ParoquiaRequest {
  nome: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  telefone?: string;
  email?: string;
  responsavel?: string;
}

export interface ParoquiaResumo {
  id: number;
  nome: string;
}

export interface Evento {
  id: number;
  paroquiaId: number;
  paroquiaNome?: string;
  nome: string;
  tema?: string;
  local?: string;
  dataInicio: string;
  dataFim: string;
  status: 'PLANEJADO' | 'EM_ANDAMENTO' | 'ENCERRADO' | 'CANCELADO';
  monitoramentoAtivo: boolean;
  monitoramentoInicio?: string;
  monitoramentoFim?: string;
}

export interface EventoRequest {
  paroquiaId: number;
  nome: string;
  tema?: string;
  local?: string;

  /**
   * Backend usa LocalDate.
   * Formato esperado pela API: yyyy-MM-dd.
   */
  dataInicio: string;
  dataFim: string;

  status: 'PLANEJADO' | 'EM_ANDAMENTO' | 'ENCERRADO' | 'CANCELADO';
  monitoramentoAtivo: boolean;

  /**
   * Backend usa LocalTime.
   * Formato esperado pela API: HH:mm.
   */
  monitoramentoInicio?: string | null;
  monitoramentoFim?: string | null;
}

export interface Pessoa {
  id: number;
  nome: string;
  telefone?: string;
  email?: string;
  dataNascimento?: string;
  tipo: PessoaTipo;
  observacoes?: string;
}

export interface PessoaRequest {
  nome: string;
  telefone?: string;
  email?: string;
  dataNascimento?: string;
  tipo: PessoaTipo;
  observacoes?: string;
}

export type TipoOperacaoTioCarona =
  'CHECKIN'
  | 'CHECKOUT';

export type StatusOperacionalTioCarona =
  | 'AGUARDANDO_CHECKIN'
  | 'COM_CHECKIN'
  | 'COM_CHECKOUT';

export interface TioCaronaEvento {
  id: number;
  eventoId: number;
  pessoaId: number;
  pessoaNome: string;
  status: TioCaronaStatus;
  observacoes?: string;

  codigoIdentificacao?: string;

  checkinRealizado?: boolean;
  checkinEm?: string;

  checkoutRealizado?: boolean;
  checkoutEm?: string;

  statusOperacional?: StatusOperacionalTioCarona;
  ultimaOperacao?: TipoOperacaoTioCarona;
  ultimaOperacaoEm?: string;
}

export interface TioCaronaEventoRequest {
  pessoaId: number;
  observacoes?: string;
}

export interface DuplaTioCarona {
  id: number;
  eventoId: number;
  codigo: string;
  apelido?: string;
  tio1Id: number;
  tio1Nome: string;
  tio2Id: number;
  tio2Nome: string;
  status: DuplaStatus;
}

export interface DuplaTioCaronaRequest {
  tio1Id: number;
  tio2Id: number;
  apelido?: string;
}

export interface Sobrinho {
  id: number;
  eventoId: number;
  nome: string;
  telefone?: string;
  responsavelNome?: string;
  responsavelTelefone?: string;
  endereco?: string;
  dataNascimento?: string;
  restricaoAlimentar?: string;
  observacaoMedica?: string;
  status: SobrinhoStatus;
}

export interface SobrinhoRequest {
  nome: string;
  telefone?: string;
  responsavelNome?: string;
  responsavelTelefone?: string;
  endereco?: string;
  dataNascimento?: string;
  restricaoAlimentar?: string;
  observacaoMedica?: string;
}

export interface SobrinhoDupla {
  id: number;
  eventoId: number;
  sobrinhoId: number;
  sobrinhoNome: string;
  duplaId: number;
  duplaCodigo: string;
  status: VinculoStatus;
}

export interface VincularSobrinhoRequest {
  sobrinhoId: number;
  duplaId: number;
}
