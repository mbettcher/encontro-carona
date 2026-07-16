package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.CadernoChoro;
import br.com.paroquia.encontro.domain.entity.Evento;
import br.com.paroquia.encontro.domain.enums.StatusCadernoChoro;
import br.com.paroquia.encontro.dto.relatorio.CadernoEquipeRelatorioItem;
import br.com.paroquia.encontro.repository.CadernoChoroRepository;
import br.com.paroquia.encontro.repository.EventoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Objects;

@Service
public class RelatorioCadernoEquipeService {
    private static final String TEMPLATE_CADERNOS_EQUIPES = "/reports/cadernos-equipes.jrxml";
    private static final DateTimeFormatter DATA_HORA_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter DATA_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final EventoRepository eventoRepository;
    private final CadernoChoroRepository cadernoRepository;
    private final JasperReportService jasperReportService;

    public RelatorioCadernoEquipeService(
            EventoRepository eventoRepository,
            CadernoChoroRepository cadernoRepository,
            JasperReportService jasperReportService
    ) {
        this.eventoRepository = eventoRepository;
        this.cadernoRepository = cadernoRepository;
        this.jasperReportService = jasperReportService;
    }

    @Transactional(readOnly = true)
    public byte[] gerarPdf(Long eventoId, Long equipeId, StatusCadernoChoro status) {
        var evento = buscarEvento(eventoId);
        var itens = montarItens(eventoId, equipeId, status);
        var parametros = montarParametros(evento, equipeId, status, itens.size());

        return jasperReportService.gerarPdf(TEMPLATE_CADERNOS_EQUIPES, parametros, itens);
    }

    private Evento buscarEvento(Long eventoId) {
        return eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));
    }

    private HashMap<String, Object> montarParametros(
            Evento evento,
            Long equipeId,
            StatusCadernoChoro status,
            int totalRegistros
    ) {
        var parametros = new HashMap<String, Object>();

        parametros.put("EVENTO_NOME", texto(evento.getNome()));
        parametros.put("PAROQUIA_NOME", evento.getParoquia() == null ? "-" : texto(evento.getParoquia().getNome()));
        parametros.put("EVENTO_LOCAL", texto(evento.getLocal()));
        parametros.put("EVENTO_PERIODO", periodoEvento(evento));
        parametros.put("EMITIDO_EM", DATA_HORA_FORMATTER.format(OffsetDateTime.now()));
        parametros.put("FILTROS", descricaoFiltros(equipeId, status));
        parametros.put("TOTAL_REGISTROS", totalRegistros);

        return parametros;
    }

    private List<CadernoEquipeRelatorioItem> montarItens(Long eventoId, Long equipeId, StatusCadernoChoro status) {
        return cadernoRepository.findByEventoIdOrderByDuplaCodigoAscSobrinhoNomeAsc(eventoId).stream()
                .filter(caderno -> equipeId == null || (
                        caderno.getEquipeMontagemKit() != null &&
                                Objects.equals(caderno.getEquipeMontagemKit().getId(), equipeId)
                ))
                .filter(caderno -> status == null || caderno.getStatus() == status)
                .sorted(Comparator
                        .comparing((CadernoChoro caderno) -> equipeNome(caderno), String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(caderno -> texto(caderno.getSobrinho().getNome()), String.CASE_INSENSITIVE_ORDER))
                .map(this::toItem)
                .toList();
    }

    private CadernoEquipeRelatorioItem toItem(CadernoChoro caderno) {
        var dupla = caderno.getDupla();
        var equipe = caderno.getEquipeMontagemKit();

        var duplaDescricao = texto(dupla.getApelido() == null || dupla.getApelido().isBlank()
                ? dupla.getCodigo()
                : dupla.getApelido() + " (" + dupla.getCodigo() + ")");

        var tiosCarona = texto(dupla.getTio1().getPessoa().getNome())
                + " / "
                + texto(dupla.getTio2().getPessoa().getNome());

        return new CadernoEquipeRelatorioItem(
                equipe == null ? null : equipe.getId(),
                equipe == null ? "Sem equipe" : texto(equipe.getApelido()),
                equipe == null ? null : equipe.getCorIdentificacao(),
                texto(caderno.getSobrinho().getNome()),
                duplaDescricao,
                tiosCarona,
                labelStatus(caderno.getStatus()),
                formatarDataHora(caderno.getRecebidoDaDuplaEm()),
                formatarDataHora(caderno.getConferidoEm()),
                formatarDataHora(caderno.getAnexadoAoKitEm()),
                formatarDataHora(caderno.getEntregueAoSobrinhoEm()),
                texto(caderno.getObservacao())
        );
    }

    private String equipeNome(CadernoChoro caderno) {
        if (caderno.getEquipeMontagemKit() == null) {
            return "ZZZ Sem equipe";
        }

        return texto(caderno.getEquipeMontagemKit().getApelido());
    }

    private String descricaoFiltros(Long equipeId, StatusCadernoChoro status) {
        if (equipeId == null && status == null) {
            return "Todos os cadernos";
        }

        var filtros = new java.util.ArrayList<String>();

        if (equipeId != null) {
            filtros.add("Equipe ID: " + equipeId);
        }

        if (status != null) {
            filtros.add("Status: " + labelStatus(status));
        }

        return String.join(" | ", filtros);
    }

    private String periodoEvento(Evento evento) {
        if (evento.getDataInicio() == null || evento.getDataFim() == null) {
            return "-";
        }

        return DATA_FORMATTER.format(evento.getDataInicio()) + " até " + DATA_FORMATTER.format(evento.getDataFim());
    }

    private String formatarDataHora(OffsetDateTime dataHora) {
        return dataHora == null ? "-" : DATA_HORA_FORMATTER.format(dataHora);
    }

    private String texto(String valor) {
        return valor == null || valor.isBlank() ? "-" : valor.trim();
    }

    private String labelStatus(StatusCadernoChoro status) {
        if (status == null) {
            return "-";
        }

        return switch (status) {
            case PENDENTE -> "Pendente";
            case ENTREGUE_A_DUPLA -> "Entregue à dupla";
            case RECEBIDO_DA_DUPLA -> "Recebido da dupla";
            case DIRECIONADO_EQUIPE_MONTAGEM -> "Com equipe do kit";
            case CONFERIDO -> "Conferido";
            case ANEXADO_AO_KIT -> "Anexado ao kit";
            case ENTREGUE_AO_SOBRINHO -> "Entregue ao encontrista";
            case PERDIDO -> "Perdido";
            case SUBSTITUIDO -> "Substituído";
            case CANCELADO -> "Cancelado";
        };
    }
}
