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

export interface Evento {
  id: number;
  paroquiaId: number;
  paroquiaNome: string;
  nome: string;
  tema?: string;
  dataInicio: string;
  dataFim: string;
  local?: string;
  status: 'PLANEJADO' | 'EM_ANDAMENTO' | 'ENCERRADO' | 'CANCELADO';
  monitoramentoInicio?: string;
  monitoramentoFim?: string;
  monitoramentoAtivo: boolean;
}

export interface Pessoa {
  id: number;
  nome: string;
  telefone?: string;
  email?: string;
  dataNascimento?: string;
  tipo: 'TIO_CARONA' | 'SOBRINHO' | 'RESPONSAVEL' | 'EQUIPE';
  observacoes?: string;
}
