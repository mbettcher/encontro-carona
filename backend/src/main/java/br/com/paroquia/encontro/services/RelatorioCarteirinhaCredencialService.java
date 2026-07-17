package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.CredencialEvento;
import br.com.paroquia.encontro.domain.entity.Evento;
import br.com.paroquia.encontro.domain.enums.ModeloCarteirinhaCredencial;
import br.com.paroquia.encontro.domain.enums.StatusCredencial;
import br.com.paroquia.encontro.domain.enums.TipoCredencial;
import br.com.paroquia.encontro.dto.relatorio.CrachaCredencialRelatorioItem;
import br.com.paroquia.encontro.repository.CredencialEventoRepository;
import br.com.paroquia.encontro.repository.EventoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;

@Service
public class RelatorioCarteirinhaCredencialService {
    private final EventoRepository eventoRepository;
    private final CredencialEventoRepository credencialRepository;
    private final JasperReportService jasperReportService;
    private final QrCodeImageService qrCodeImageService;

    public RelatorioCarteirinhaCredencialService(
            EventoRepository eventoRepository,
            CredencialEventoRepository credencialRepository,
            JasperReportService jasperReportService,
            QrCodeImageService qrCodeImageService
    ) {
        this.eventoRepository = eventoRepository;
        this.credencialRepository = credencialRepository;
        this.jasperReportService = jasperReportService;
        this.qrCodeImageService = qrCodeImageService;
    }

    @Transactional(readOnly = true)
    public byte[] gerarCarteirinhas(
            Long eventoId,
            ModeloCarteirinhaCredencial modelo,
            TipoCredencial tipo,
            StatusCredencial status
    ) {
        var evento = buscarEvento(eventoId);
        var modeloResolvido = modelo == null ? ModeloCarteirinhaCredencial.A4_10_CARTEIRINHAS : modelo;
        var itens = montarItens(eventoId, evento, tipo, status);

        if (itens.isEmpty()) {
            throw new BusinessException("Não há credenciais para os filtros selecionados.");
        }

        var parametros = new HashMap<String, Object>();
        parametros.put("EVENTO_NOME", texto(evento.getNome()));
        parametros.put("FILTROS", descricaoFiltros(modeloResolvido, tipo, status));
        parametros.put("TOTAL_REGISTROS", itens.size());

        return jasperReportService.gerarPdf(template(modeloResolvido), parametros, itens);
    }

    private Evento buscarEvento(Long eventoId) {
        return eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));
    }

    private List<CrachaCredencialRelatorioItem> montarItens(
            Long eventoId,
            Evento evento,
            TipoCredencial tipo,
            StatusCredencial status
    ) {
        return credencialRepository.findByEventoIdOrderByTipoAscCodigoAsc(eventoId).stream()
                .filter(credencial -> tipo == null || credencial.getTipo() == tipo)
                .filter(credencial -> status == null || credencial.getStatus() == status)
                .sorted(Comparator
                        .comparing((CredencialEvento credencial) -> credencial.getTipo().name())
                        .thenComparing(this::nomeCredencial, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(CredencialEvento::getCodigo))
                .map(credencial -> toItem(credencial, evento))
                .toList();
    }

    private CrachaCredencialRelatorioItem toItem(CredencialEvento credencial, Evento evento) {
        var qrCode = qrCodeImageService.gerar(credencial.getCodigo(), 260);

        return new CrachaCredencialRelatorioItem(
                qrCode,
                texto(credencial.getCodigo()),
                nomeCredencial(credencial),
                labelTipo(credencial.getTipo()).toUpperCase(),
                complemento(credencial),
                texto(evento.getNome()),
                detalhe(credencial),
                "Credencial operacional"
        );
    }

    private String nomeCredencial(CredencialEvento credencial) {
        if (credencial.getTipo() == TipoCredencial.TIO_CARONA && credencial.getTioCaronaEvento() != null) {
            return texto(credencial.getTioCaronaEvento().getPessoa().getNome());
        }

        if (credencial.getTipo() == TipoCredencial.SOBRINHO && credencial.getSobrinho() != null) {
            return texto(credencial.getSobrinho().getNome());
        }

        return "-";
    }

    private String complemento(CredencialEvento credencial) {
        if (credencial.getTipo() == TipoCredencial.TIO_CARONA) {
            return "Tio Carona";
        }

        if (credencial.getSobrinho() != null && credencial.getSobrinho().getResponsavelNome() != null) {
            return "Resp.: " + texto(credencial.getSobrinho().getResponsavelNome());
        }

        return "Encontrista";
    }

    private String detalhe(CredencialEvento credencial) {
        if (credencial.getTipo() == TipoCredencial.TIO_CARONA) {
            return "Apoio e transporte";
        }

        if (credencial.getSobrinho() != null && credencial.getSobrinho().getTelefone() != null) {
            return "Contato: " + texto(credencial.getSobrinho().getTelefone());
        }

        return "Participante do encontro";
    }

    private String labelTipo(TipoCredencial tipo) {
        if (tipo == null) {
            return "-";
        }

        return switch (tipo) {
            case TIO_CARONA -> "Tio Carona";
            case SOBRINHO -> "Encontrista";
        };
    }

    private String descricaoFiltros(ModeloCarteirinhaCredencial modelo, TipoCredencial tipo, StatusCredencial status) {
        var filtros = new java.util.ArrayList<String>();
        filtros.add("Modelo: " + labelModelo(modelo));
        filtros.add(tipo == null ? "Público: todos" : "Público: " + labelTipo(tipo));
        filtros.add(status == null ? "Status: todos" : "Status: " + labelStatus(status));

        return String.join(" | ", filtros);
    }

    private String labelModelo(ModeloCarteirinhaCredencial modelo) {
        return switch (modelo) {
            case A4_10_CARTEIRINHAS -> "A4 - 10 carteirinhas";
            case CARTEIRINHA_CR80_86X54 -> "Carteirinha unitária CR80 - 86 x 54 mm";
        };
    }

    private String labelStatus(StatusCredencial status) {
        if (status == null) {
            return "-";
        }

        return switch (status) {
            case ATIVA -> "Ativas";
            case INATIVA -> "Inativas";
            case CANCELADA -> "Canceladas";
        };
    }

    private String template(ModeloCarteirinhaCredencial modelo) {
        return switch (modelo) {
            case A4_10_CARTEIRINHAS -> "/reports/carteirinhas-credenciais-a4-10.jrxml";
            case CARTEIRINHA_CR80_86X54 -> "/reports/carteirinha-credencial-cr80.jrxml";
        };
    }

    private String texto(String valor) {
        return valor == null || valor.isBlank() ? "-" : valor.trim();
    }
}
