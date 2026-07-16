package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.CadernoChoro;
import br.com.paroquia.encontro.domain.enums.StatusCadernoChoro;
import br.com.paroquia.encontro.dto.relatorio.CadernoEquipeRelatorioItem;
import br.com.paroquia.encontro.repository.CadernoChoroRepository;
import br.com.paroquia.encontro.repository.EventoRepository;
import net.sf.jasperreports.engine.JREmptyDataSource;
import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RelatorioCadernoEquipeService {
    private static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final EventoRepository eventoRepository;
    private final CadernoChoroRepository cadernoRepository;

    public RelatorioCadernoEquipeService(
            EventoRepository eventoRepository,
            CadernoChoroRepository cadernoRepository
    ) {
        this.eventoRepository = eventoRepository;
        this.cadernoRepository = cadernoRepository;
    }

    @Transactional(readOnly = true)
    public byte[] gerarPdf(Long eventoId, Long equipeId, StatusCadernoChoro status) {
        var evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));

        var cadernos = cadernoRepository.findByEventoIdOrderByDuplaCodigoAscSobrinhoNomeAsc(eventoId).stream()
                .filter(caderno -> equipeId == null || possuiEquipe(caderno, equipeId))
                .filter(caderno -> status == null || caderno.getStatus() == status)
                .sorted(Comparator
                        .comparing(this::equipeOrdenacao, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(caderno -> caderno.getSobrinho().getNome(), String.CASE_INSENSITIVE_ORDER)
                )
                .toList();

        var itens = cadernos.stream()
                .map(this::toItem)
                .toList();

        var parametros = new HashMap<String, Object>();
        parametros.put("EVENTO_NOME", evento.getNome());
        parametros.put("EVENTO_LOCAL", textoOuTraco(evento.getLocal()));
        parametros.put("EVENTO_PERIODO", DATA.format(evento.getDataInicio()) + " até " + DATA.format(evento.getDataFim()));
        parametros.put("PAROQUIA_NOME", evento.getParoquia().getNome());
        parametros.put("EMITIDO_EM", DATA_HORA.format(OffsetDateTime.now()));
        parametros.put("FILTROS", descricaoFiltros(equipeId, status));
        parametros.put("TOTAL_REGISTROS", itens.size());

        return gerarPdfJasper("reports/cadernos-equipes.jrxml", parametros, itens);
    }

    private boolean possuiEquipe(CadernoChoro caderno, Long equipeId) {
        return caderno.getEquipeMontagemKit() != null
                && caderno.getEquipeMontagemKit().getId().equals(equipeId);
    }

    private String equipeOrdenacao(CadernoChoro caderno) {
        if (caderno.getEquipeMontagemKit() == null) {
            return "ZZZ - Sem equipe";
        }

        return caderno.getEquipeMontagemKit().getApelido();
    }

    private CadernoEquipeRelatorioItem toItem(CadernoChoro caderno) {
        var equipe = caderno.getEquipeMontagemKit();
        var dupla = caderno.getDupla();

        return new CadernoEquipeRelatorioItem(
                equipe == null ? null : equipe.getId(),
                equipe == null ? "Sem equipe" : equipe.getApelido(),
                equipe == null ? "#64748b" : equipe.getCorIdentificacao(),
                caderno.getSobrinho().getNome(),
                textoDupla(dupla.getCodigo(), dupla.getApelido()),
                dupla.getTio1().getPessoa().getNome() + " / " + dupla.getTio2().getPessoa().getNome(),
                labelStatus(caderno.getStatus()),
                formatar(caderno.getRecebidoDaDuplaEm()),
                formatar(caderno.getConferidoEm()),
                formatar(caderno.getAnexadoAoKitEm()),
                formatar(caderno.getEntregueAoSobrinhoEm()),
                textoOuVazio(caderno.getObservacao())
        );
    }

    private byte[] gerarPdfJasper(
            String templateClasspath,
            Map<String, Object> parametros,
            List<CadernoEquipeRelatorioItem> itens
    ) {
        try (var inputStream = new ClassPathResource(templateClasspath).getInputStream()) {
            var jasperReport = JasperCompileManager.compileReport(inputStream);
            var dataSource = itens.isEmpty()
                    ? new JREmptyDataSource()
                    : new JRBeanCollectionDataSource(itens);
            var jasperPrint = JasperFillManager.fillReport(jasperReport, parametros, dataSource);

            return JasperExportManager.exportReportToPdf(jasperPrint);
        } catch (JRException | IOException ex) {
            throw new BusinessException("Não foi possível gerar o relatório de Cadernos de Mensagens.");
        }
    }

    private String descricaoFiltros(Long equipeId, StatusCadernoChoro status) {
        var filtros = new StringBuilder();

        if (equipeId != null) {
            filtros.append("Equipe ID: ").append(equipeId);
        }

        if (status != null) {
            if (!filtros.isEmpty()) {
                filtros.append(" | ");
            }

            filtros.append("Status: ").append(labelStatus(status));
        }

        return filtros.isEmpty() ? "Todos os cadernos do evento" : filtros.toString();
    }

    private String textoDupla(String codigo, String apelido) {
        if (apelido == null || apelido.isBlank()) {
            return codigo;
        }

        return apelido + " (" + codigo + ")";
    }

    private String formatar(OffsetDateTime dataHora) {
        return dataHora == null ? "-" : DATA_HORA.format(dataHora);
    }

    private String textoOuTraco(String valor) {
        return valor == null || valor.isBlank() ? "-" : valor.trim();
    }

    private String textoOuVazio(String valor) {
        return valor == null || valor.isBlank() ? "" : valor.trim();
    }

    private String labelStatus(StatusCadernoChoro status) {
        return switch (status) {
            case PENDENTE -> "Pendente";
            case ENTREGUE_A_DUPLA -> "Entregue à dupla";
            case RECEBIDO_DA_DUPLA -> "Recebido da dupla";
            case DIRECIONADO_EQUIPE_MONTAGEM -> "Direcionado à equipe";
            case CONFERIDO -> "Conferido";
            case ANEXADO_AO_KIT -> "Anexado ao kit";
            case ENTREGUE_AO_SOBRINHO -> "Entregue ao encontrista";
            case PERDIDO -> "Perdido";
            case SUBSTITUIDO -> "Substituído";
            case CANCELADO -> "Cancelado";
        };
    }
}
