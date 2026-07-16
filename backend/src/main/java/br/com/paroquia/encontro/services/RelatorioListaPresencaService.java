package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.Evento;
import br.com.paroquia.encontro.domain.entity.SobrinhoDupla;
import br.com.paroquia.encontro.domain.entity.TioCaronaEvento;
import br.com.paroquia.encontro.domain.enums.SobrinhoStatus;
import br.com.paroquia.encontro.domain.enums.TioCaronaStatus;
import br.com.paroquia.encontro.domain.enums.VinculoStatus;
import br.com.paroquia.encontro.dto.relatorio.ListaPresencaEncontristaItem;
import br.com.paroquia.encontro.dto.relatorio.ListaPresencaTioCaronaItem;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.SobrinhoDuplaRepository;
import br.com.paroquia.encontro.repository.TioCaronaEventoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;

@Service
public class RelatorioListaPresencaService {
    private static final String TEMPLATE_ENCONTRISTAS = "/reports/lista-presenca-encontristas.jrxml";
    private static final String TEMPLATE_TIOS_CARONA = "/reports/lista-presenca-tios-carona.jrxml";

    private static final DateTimeFormatter DATA_HORA_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter DATA_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final EventoRepository eventoRepository;
    private final SobrinhoDuplaRepository sobrinhoDuplaRepository;
    private final TioCaronaEventoRepository tioCaronaEventoRepository;
    private final JasperReportService jasperReportService;

    public RelatorioListaPresencaService(
            EventoRepository eventoRepository,
            SobrinhoDuplaRepository sobrinhoDuplaRepository,
            TioCaronaEventoRepository tioCaronaEventoRepository,
            JasperReportService jasperReportService
    ) {
        this.eventoRepository = eventoRepository;
        this.sobrinhoDuplaRepository = sobrinhoDuplaRepository;
        this.tioCaronaEventoRepository = tioCaronaEventoRepository;
        this.jasperReportService = jasperReportService;
    }

    @Transactional(readOnly = true)
    public byte[] listaPresencaEncontristas(Long eventoId, Boolean somenteAtivos) {
        var evento = buscarEvento(eventoId);
        var ativos = somenteAtivos == null || somenteAtivos;
        var itens = montarEncontristas(eventoId, ativos);
        var parametros = montarParametros(evento, ativos ? "Encontristas com vínculo ativo" : "Todos os vínculos", itens.size());

        return jasperReportService.gerarPdf(TEMPLATE_ENCONTRISTAS, parametros, itens);
    }

    @Transactional(readOnly = true)
    public byte[] listaPresencaTiosCarona(Long eventoId, Boolean somenteAtivos) {
        var evento = buscarEvento(eventoId);
        var ativos = somenteAtivos == null || somenteAtivos;
        var itens = montarTiosCarona(eventoId, ativos);
        var parametros = montarParametros(evento, ativos ? "Tios carona ativos" : "Todos os tios carona", itens.size());

        return jasperReportService.gerarPdf(TEMPLATE_TIOS_CARONA, parametros, itens);
    }

    private Evento buscarEvento(Long eventoId) {
        return eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));
    }

    private HashMap<String, Object> montarParametros(Evento evento, String filtros, int totalRegistros) {
        var parametros = new HashMap<String, Object>();

        parametros.put("EVENTO_NOME", texto(evento.getNome()));
        parametros.put("PAROQUIA_NOME", evento.getParoquia() == null ? "-" : texto(evento.getParoquia().getNome()));
        parametros.put("EVENTO_LOCAL", texto(evento.getLocal()));
        parametros.put("EVENTO_PERIODO", periodoEvento(evento));
        parametros.put("EMITIDO_EM", DATA_HORA_FORMATTER.format(OffsetDateTime.now()));
        parametros.put("FILTROS", filtros);
        parametros.put("TOTAL_REGISTROS", totalRegistros);

        return parametros;
    }

    private List<ListaPresencaEncontristaItem> montarEncontristas(Long eventoId, boolean somenteAtivos) {
        var vinculos = somenteAtivos
                ? sobrinhoDuplaRepository.findByEventoIdAndStatusOrderByDuplaCodigoAscSobrinhoNomeAsc(eventoId, VinculoStatus.ATIVO)
                : sobrinhoDuplaRepository.findByEventoIdOrderByDuplaCodigoAscSobrinhoNomeAsc(eventoId);

        var contador = new java.util.concurrent.atomic.AtomicInteger(1);

        return vinculos.stream()
                .filter(vinculo -> !somenteAtivos || vinculo.getSobrinho().getStatus() != SobrinhoStatus.DESISTENTE)
                .map(vinculo -> toEncontristaItem(contador.getAndIncrement(), vinculo))
                .toList();
    }

    private ListaPresencaEncontristaItem toEncontristaItem(Integer numero, SobrinhoDupla vinculo) {
        var sobrinho = vinculo.getSobrinho();
        var dupla = vinculo.getDupla();

        var duplaDescricao = texto(dupla.getApelido() == null || dupla.getApelido().isBlank()
                ? dupla.getCodigo()
                : dupla.getApelido() + " (" + dupla.getCodigo() + ")");

        var tiosCarona = texto(dupla.getTio1().getPessoa().getNome())
                + " / "
                + texto(dupla.getTio2().getPessoa().getNome());

        return new ListaPresencaEncontristaItem(
                numero,
                texto(sobrinho.getNome()),
                duplaDescricao,
                tiosCarona,
                labelStatusSobrinho(sobrinho.getStatus()),
                texto(sobrinho.getResponsavelNome()),
                texto(vinculo.getStatus().name())
        );
    }

    private List<ListaPresencaTioCaronaItem> montarTiosCarona(Long eventoId, boolean somenteAtivos) {
        var contador = new java.util.concurrent.atomic.AtomicInteger(1);

        return tioCaronaEventoRepository.findByEventoIdOrderByPessoaNomeAsc(eventoId).stream()
                .filter(tio -> !somenteAtivos || tio.getStatus() == TioCaronaStatus.ATIVO)
                .map(tio -> toTioCaronaItem(contador.getAndIncrement(), tio))
                .toList();
    }

    private ListaPresencaTioCaronaItem toTioCaronaItem(Integer numero, TioCaronaEvento tio) {
        return new ListaPresencaTioCaronaItem(
                numero,
                texto(tio.getPessoa().getNome()),
                texto(tio.getCodigoIdentificacao()),
                labelStatusTio(tio.getStatus()),
                situacaoOperacional(tio),
                texto(tio.getObservacoes())
        );
    }

    private String situacaoOperacional(TioCaronaEvento tio) {
        if (tio.isCheckinRealizado() && !tio.isCheckoutRealizado()) {
            return "Com check-in";
        }

        if (tio.isCheckoutRealizado()) {
            return "Com checkout";
        }

        return "Aguardando check-in";
    }

    private String periodoEvento(Evento evento) {
        if (evento.getDataInicio() == null || evento.getDataFim() == null) {
            return "-";
        }

        return DATA_FORMATTER.format(evento.getDataInicio()) + " até " + DATA_FORMATTER.format(evento.getDataFim());
    }

    private String texto(String valor) {
        return valor == null || valor.isBlank() ? "-" : valor.trim();
    }

    private String labelStatusSobrinho(SobrinhoStatus status) {
        if (status == null) {
            return "-";
        }

        return switch (status) {
            case INSCRITO -> "Inscrito";
            case PRESENTE -> "Presente";
            case AUSENTE -> "Ausente";
            case DESISTENTE -> "Desistente";
        };
    }

    private String labelStatusTio(TioCaronaStatus status) {
        if (status == null) {
            return "-";
        }

        return switch (status) {
            case ATIVO -> "Ativo";
            case INATIVO -> "Inativo";
        };
    }
}
