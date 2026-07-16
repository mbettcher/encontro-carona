export interface DashboardResumo {
  geradoEm: string;
  eventoSelecionadoId: number | null;
  base: DashboardBaseResumo;
  evento: DashboardEventoResumo | null;
}

export interface DashboardBaseResumo {
  totalEventos: number;
  totalPessoas: number;
  totalParoquias: number;
  totalUsuariosSistema: number;
}

export interface DashboardEventoResumo {
  id: number;
  nome: string;
  tema: string | null;
  paroquiaNome: string | null;
  dataInicio: string;
  dataFim: string;
  local: string | null;
  status: string;

  totalTiosCarona: number;
  totalTiosCaronaAtivos: number;
  tiosComCheckin: number;
  tiosComCheckout: number;

  totalDuplas: number;
  totalDuplasAtivas: number;

  totalEncontristas: number;
  totalEncontristasAtivos: number;

  totalVinculos: number;
  totalVinculosAtivos: number;

  totalCadernos: number;
  cadernosPendentes: number;
  cadernosEntreguesADupla: number;
  cadernosRecebidosDaDupla: number;
  cadernosConferidos: number;
  cadernosAnexadosAoKit: number;
  cadernosEntreguesAoSobrinho: number;
  cadernosPerdidos: number;
  cadernosSubstituidos: number;
  cadernosCancelados: number;

  totalCredenciais: number;
  credenciaisAtivas: number;
  credenciaisInativas: number;
  credenciaisCanceladas: number;
  credenciaisTioCarona: number;
  credenciaisSobrinho: number;

  presencasPresentes: number;
  presencasAusentes: number;
  presencasDesistentes: number;

  operacoesCheckin: number;
  operacoesCheckout: number;
}

export interface DashboardEventoOpcao {
  id: number;
  nome: string;
  dataInicio?: string | null;
  dataFim?: string | null;
  status?: string | null;
}

export type DashboardStatusPresenca = 'PRESENTE' | 'AUSENTE' | 'DESISTENTE';

export interface DashboardSobrinhoPresenca {
  id?: number;
  sobrinhoId: number;
  status: DashboardStatusPresenca | string;
  ocorridoEm?: string | null;
}
