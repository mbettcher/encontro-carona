export type EventoStatus = 'PLANEJADO' | 'EM_ANDAMENTO' | 'ENCERRADO' | 'CANCELADO';
export type PessoaTipo = 'TIO_CARONA' | 'SOBRINHO' | 'RESPONSAVEL' | 'EQUIPE';
export type TioCaronaStatus = 'ATIVO' | 'INATIVO';
export type DuplaStatus = 'ATIVA' | 'INATIVA';
export type SobrinhoStatus = 'INSCRITO' | 'PRESENTE' | 'AUSENTE' | 'DESISTENTE';
export type VinculoStatus = 'ATIVO' | 'REMOVIDO';
export type StatusEquipeMontagemKit = 'ATIVA' | 'INATIVA';

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

  credencialId?: number;
  credencialCodigo?: string;
  credencialStatus?: StatusCredencial;
  credencialAtiva?: boolean;

  statusOperacional?: StatusOperacionalTioCarona;
  ultimaOperacao?: TipoOperacaoTioCarona;
  ultimaOperacaoEm?: string;
}

export interface TioCaronaEventoRequest {
  pessoaId: number;
  observacoes?: string;
}

export interface AtualizarTioCaronaEventoRequest {
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

export interface AtualizarDuplaTioCaronaRequest {
  apelido?: string;
}

export type OperacaoPresencaSobrinho =
  'PRESENTE'
  | 'AUSENTE'
  | 'DESISTENTE';

export type OrigemPresencaSobrinho =
  'MANUAL'
  | 'CREDENCIAL'
  | 'SISTEMA';

export interface Sobrinho {
  id: number;
  eventoId?: number;
  pessoaId?: number;
  pessoaNome?: string;
  nome: string;
  telefone?: string;
  responsavelNome?: string;
  responsavelTelefone?: string;
  endereco?: string;
  dataNascimento?: string;
  restricaoAlimentar?: string;
  observacaoMedica?: string;
  status: SobrinhoStatus;

  statusAtualPresenca?: SobrinhoStatus;
  ultimaPresencaEm?: string;
}

export interface SobrinhoPresenca {
  id: number;
  eventoId: number;
  sobrinhoId: number;
  sobrinhoNome: string;
  status: SobrinhoStatus;
  origem: OrigemPresencaSobrinho;
  observacao?: string;
  ocorridoEm: string;
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

export interface AdicionarPessoaSobrinhoRequest {
  pessoaId: number;
  telefone?: string;
  responsavelNome: string;
  responsavelTelefone: string;
  endereco: string;
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

export interface TrocarDuplaVinculoRequest {
  duplaId: number;
}

export type StatusCadernoChoro =
  | 'PENDENTE'
  | 'ENTREGUE_A_DUPLA'
  | 'RECEBIDO_DA_DUPLA'
  | 'DIRECIONADO_EQUIPE_MONTAGEM'
  | 'CONFERIDO'
  | 'ANEXADO_AO_KIT'
  | 'ENTREGUE_AO_SOBRINHO'
  | 'PERDIDO'
  | 'SUBSTITUIDO'
  | 'CANCELADO';

export interface CadernoChoro {
  id: number;
  eventoId: number;
  duplaId: number;
  duplaCodigo: string;
  duplaApelido?: string;
  tio1Nome: string;
  tio2Nome: string;
  sobrinhoId: number;
  sobrinhoNome: string;
  equipeMontagemKitId?: number;
  equipeMontagemKitApelido?: string;
  equipeMontagemKitCorIdentificacao?: string;
  status: StatusCadernoChoro;
  entregueADuplaEm?: string;
  recebidoDaDuplaEm?: string;
  direcionadoEquipeMontagemEm?: string;
  conferidoEm?: string;
  anexadoAoKitEm?: string;
  entregueAoSobrinhoEm?: string;
  observacao?: string;
  criadoEm: string;
}

export interface CadernoChoroGeracaoResponse {
  eventoId: number;
  criados: number;
  existentes: number;
  total: number;
}

export interface CadernoChoroHistorico {
  id: number;
  eventoId: number;
  cadernoId: number;
  duplaId: number;
  duplaCodigo: string;
  sobrinhoId: number;
  sobrinhoNome: string;
  equipeMontagemKitId?: number;
  equipeMontagemKitApelido?: string;
  status: StatusCadernoChoro;
  observacao?: string;
  ocorridoEm: string;
}


export interface EquipeMontagemKitIntegrante {
  id: number;
  pessoaId: number;
  pessoaNome: string;
  criadoEm: string;
}

export interface EquipeMontagemKit {
  id: number;
  eventoId: number;
  apelido: string;
  corIdentificacao?: string;
  status: StatusEquipeMontagemKit;
  integrantes: EquipeMontagemKitIntegrante[];
  criadoEm: string;
}

export interface EquipeMontagemKitRequest {
  apelido: string;
  corIdentificacao?: string;
  integranteIds?: number[];
}

export interface EquipeMontagemKitIntegranteRequest {
  pessoaId: number;
}



export type ModeloEtiquetaQr =
  | 'A4_3_COLUNAS_24'
  | 'A4_2_COLUNAS_14'
  | 'ETIQUETA_70X37'
  | 'ETIQUETA_50X30';

export type TipoCredencial =
  'TIO_CARONA'
  | 'SOBRINHO';

export type StatusCredencial =
  'ATIVA'
  | 'INATIVA'
  | 'CANCELADA';

export interface CredencialEvento {
  id: number;
  eventoId: number;
  eventoNome: string;
  tipo: TipoCredencial;
  codigo: string;
  status: StatusCredencial;

  tioCaronaEventoId?: number;
  pessoaId?: number;
  pessoaNome?: string;

  sobrinhoId?: number;
  sobrinhoNome?: string;
  responsavelNome?: string;

  duplaId?: number;
  duplaCodigo?: string;
  duplaApelido?: string;

  criadoEm: string;
  atualizadoEm?: string;
}

export interface CredencialGeracaoResponse {
  eventoId: number;
  criadas: number;
  existentes: number;
  total: number;
}

export interface SubstituirDuplaVinculoRequest {
  novaDuplaId: number;
  motivo: string;
  confirmarCadernoDevolvido?: boolean;
}
