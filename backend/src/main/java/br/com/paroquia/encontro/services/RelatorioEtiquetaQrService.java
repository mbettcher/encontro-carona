package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.CredencialEvento;
import br.com.paroquia.encontro.domain.entity.Evento;
import br.com.paroquia.encontro.domain.enums.ModeloEtiquetaQr;
import br.com.paroquia.encontro.domain.enums.StatusCredencial;
import br.com.paroquia.encontro.domain.enums.TipoCredencial;
import br.com.paroquia.encontro.dto.relatorio.EtiquetaQrRelatorioItem;
import br.com.paroquia.encontro.repository.CredencialEventoRepository;
import br.com.paroquia.encontro.repository.EventoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;

@Service
public class RelatorioEtiquetaQrService {
    private final EventoRepository eventoRepository;
    private final CredencialEventoRepository credencialRepository;
    private final JasperReportService jasperReportService;
    private final QrCodeImageService qrCodeImageService;

    public RelatorioEtiquetaQrService(
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
    public byte[] gerarEtiquetasQr(
            Long eventoId,
            ModeloEtiquetaQr modelo,
            TipoCredencial tipo,
            StatusCredencial status,
            String filtro
    ) {
        var evento = buscarEvento(eventoId);
        var modeloResolvido = modelo == null ? ModeloEtiquetaQr.A4_3_COLUNAS_24 : modelo;
        var itens = montarItens(eventoId, evento, tipo, status, filtro);

        if (itens.isEmpty()) {
            throw new BusinessException("Não há credenciais para os filtros selecionados.");
        }

        var parametros = new HashMap<String, Object>();
        parametros.put("EVENTO_NOME", texto(evento.getNome()));
        parametros.put("FILTROS", descricaoFiltros(modeloResolvido, tipo, status, filtro));
        parametros.put("TOTAL_REGISTROS", itens.size());

        return jasperReportService.gerarPdf(template(modeloResolvido), parametros, itens);
    }

    private Evento buscarEvento(Long eventoId) {
        return eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));
    }

    private List<EtiquetaQrRelatorioItem> montarItens(
            Long eventoId,
            Evento evento,
            TipoCredencial tipo,
            StatusCredencial status,
            String filtro
    ) {
        return credencialRepository.findByEventoIdOrderByTipoAscCodigoAsc(eventoId).stream()
                .filter(credencial -> tipo == null || credencial.getTipo() == tipo)
                .filter(credencial -> status == null || credencial.getStatus() == status)
                .filter(credencial -> correspondeFiltro(credencial, filtro))
                .sorted(Comparator
                        .comparing((CredencialEvento credencial) -> credencial.getTipo().name())
                        .thenComparing(this::nomeCredencial, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(CredencialEvento::getCodigo))
                .map(credencial -> toItem(credencial, evento))
                .toList();
    }

    private EtiquetaQrRelatorioItem toItem(CredencialEvento credencial, Evento evento) {
        var qrCode = qrCodeImageService.gerar(credencial.getCodigo(), 220);

        return new EtiquetaQrRelatorioItem(
                qrCode,
                texto(credencial.getCodigo()),
                nomeCredencial(credencial),
                labelTipo(credencial.getTipo()),
                complemento(credencial),
                texto(evento.getNome())
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


    private boolean correspondeFiltro(CredencialEvento credencial, String filtro) {
        var filtroNormalizado = normalizarFiltro(filtro);

        if (filtroNormalizado.isBlank()) {
            return true;
        }

        return contemFiltro(credencial.getCodigo(), filtroNormalizado)
                || contemFiltro(nomeCredencial(credencial), filtroNormalizado)
                || contemFiltro(complemento(credencial), filtroNormalizado)
                || contemFiltro(labelTipo(credencial.getTipo()), filtroNormalizado);
    }

    private boolean contemFiltro(String valor, String filtroNormalizado) {
        return normalizarFiltro(valor).contains(filtroNormalizado);
    }

    private String normalizarFiltro(String valor) {
        if (valor == null || valor.isBlank()) {
            return "";
        }

        return java.text.Normalizer
                .normalize(valor, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .trim();
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

    private String descricaoFiltros(ModeloEtiquetaQr modelo, TipoCredencial tipo, StatusCredencial status, String filtro) {
        var filtros = new java.util.ArrayList<String>();
        filtros.add("Modelo: " + labelModelo(modelo));
        filtros.add(tipo == null ? "Público: todos" : "Público: " + labelTipo(tipo));
        filtros.add(status == null ? "Status: todos" : "Status: " + labelStatus(status));

        if (filtro != null && !filtro.isBlank()) {
            filtros.add("Busca: " + filtro.trim());
        }

        return String.join(" | ", filtros);
    }

    private String labelModelo(ModeloEtiquetaQr modelo) {
        return switch (modelo) {
            case A4_3_COLUNAS_24 -> "A4 - 3 colunas / 24 etiquetas";
            case A4_2_COLUNAS_14 -> "A4 - 2 colunas / 14 etiquetas";
            case ETIQUETA_70X37 -> "Etiqueta 70 x 37 mm";
            case ETIQUETA_50X30 -> "Etiqueta 50 x 30 mm";
            case PIMACO_A4348_31X17_96 -> "Pimaco A4348 - 31,0 x 17,0 mm / 96 etiquetas";
            case PIMACO_A4356_63X25_33 -> "Pimaco A4356 - 63,5 x 25,4 mm / 33 etiquetas";
            case PIMACO_A4362_99X34_16 -> "Pimaco A4362 - 99,0 x 33,9 mm / 16 etiquetas";
            case PIMACO_A4355_63X47_18 -> "Pimaco A4355 - 63,5 x 46,6 mm / 18 etiquetas";
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

    private String template(ModeloEtiquetaQr modelo) {
        return switch (modelo) {
            case A4_3_COLUNAS_24 -> "/reports/etiquetas-qr-a4-3-colunas.jrxml";
            case A4_2_COLUNAS_14 -> "/reports/etiquetas-qr-a4-2-colunas.jrxml";
            case ETIQUETA_70X37 -> "/reports/etiquetas-qr-70x37.jrxml";
            case ETIQUETA_50X30 -> "/reports/etiquetas-qr-50x30.jrxml";
            case PIMACO_A4348_31X17_96 -> "/reports/etiquetas-qr-pimaco-a4348.jrxml";
            case PIMACO_A4356_63X25_33 -> "/reports/etiquetas-qr-pimaco-a4356.jrxml";
            case PIMACO_A4362_99X34_16 -> "/reports/etiquetas-qr-pimaco-a4362.jrxml";
            case PIMACO_A4355_63X47_18 -> "/reports/etiquetas-qr-pimaco-a4355.jrxml";
        };
    }

    private String texto(String valor) {
        return valor == null || valor.isBlank() ? "-" : valor.trim();
    }
}
