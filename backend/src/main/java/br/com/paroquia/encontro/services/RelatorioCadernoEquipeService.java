package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.CadernoChoro;
import br.com.paroquia.encontro.domain.entity.Evento;
import br.com.paroquia.encontro.domain.enums.StatusCadernoChoro;
import br.com.paroquia.encontro.dto.relatorio.CadernoEquipeRelatorioItem;
import br.com.paroquia.encontro.repository.CadernoChoroRepository;
import br.com.paroquia.encontro.repository.EventoRepository;
import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import net.sf.jasperreports.engine.design.JRDesignBand;
import net.sf.jasperreports.engine.design.JRDesignExpression;
import net.sf.jasperreports.engine.design.JRDesignField;
import net.sf.jasperreports.engine.design.JRDesignLine;
import net.sf.jasperreports.engine.design.JRDesignParameter;
import net.sf.jasperreports.engine.design.JRDesignRectangle;
import net.sf.jasperreports.engine.design.JRDesignSection;
import net.sf.jasperreports.engine.design.JRDesignStaticText;
import net.sf.jasperreports.engine.design.JRDesignTextField;
import net.sf.jasperreports.engine.design.JasperDesign;
import net.sf.jasperreports.engine.type.HorizontalTextAlignEnum;
import net.sf.jasperreports.engine.type.ModeEnum;
import net.sf.jasperreports.engine.type.OrientationEnum;
import net.sf.jasperreports.engine.type.VerticalTextAlignEnum;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Objects;

@Service
public class RelatorioCadernoEquipeService {
    private static final Logger log = LoggerFactory.getLogger(RelatorioCadernoEquipeService.class);
    private static final DateTimeFormatter DATA_HORA_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter DATA_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

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
        var evento = buscarEvento(eventoId);
        var itens = montarItens(eventoId, equipeId, status);

        try {
            var parametros = new HashMap<String, Object>();
            parametros.put("EVENTO_NOME", texto(evento.getNome()));
            parametros.put("PAROQUIA_NOME", evento.getParoquia() == null ? "-" : texto(evento.getParoquia().getNome()));
            parametros.put("EVENTO_LOCAL", texto(evento.getLocal()));
            parametros.put("EVENTO_PERIODO", periodoEvento(evento));
            parametros.put("EMITIDO_EM", DATA_HORA_FORMATTER.format(OffsetDateTime.now()));
            parametros.put("FILTROS", descricaoFiltros(equipeId, status));
            parametros.put("TOTAL_REGISTROS", itens.size());

            var jasperReport = JasperCompileManager.compileReport(criarDesign());
            var dataSource = new JRBeanCollectionDataSource(itens);
            var jasperPrint = JasperFillManager.fillReport(jasperReport, parametros, dataSource);

            return JasperExportManager.exportReportToPdf(jasperPrint);
        } catch (JRException ex) {
            log.error("Erro Jasper ao gerar relatório de Cadernos de Mensagens. eventoId={}, equipeId={}, status={}",
                    eventoId, equipeId, status, ex);
            throw new BusinessException("Erro Jasper ao gerar relatório de Cadernos de Mensagens: " + mensagemCurta(ex));
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Erro inesperado ao gerar relatório de Cadernos de Mensagens. eventoId={}, equipeId={}, status={}",
                    eventoId, equipeId, status, ex);
            throw new BusinessException("Não foi possível gerar o relatório de Cadernos de Mensagens: " + mensagemCurta(ex));
        }
    }

    private Evento buscarEvento(Long eventoId) {
        return eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));
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

    private JasperDesign criarDesign() throws JRException {
        var design = new JasperDesign();
        design.setName("cadernos_equipes");
        design.setPageWidth(842);
        design.setPageHeight(595);
        design.setOrientation(OrientationEnum.LANDSCAPE);
        design.setColumnWidth(802);
        design.setLeftMargin(20);
        design.setRightMargin(20);
        design.setTopMargin(20);
        design.setBottomMargin(20);

        adicionarParametros(design);
        adicionarCampos(design);
        adicionarTitulo(design);
        adicionarCabecalho(design);
        adicionarDetalhe(design);
        adicionarRodape(design);
        adicionarResumo(design);

        return design;
    }

    private void adicionarParametros(JasperDesign design) throws JRException {
        adicionarParametro(design, "EVENTO_NOME", String.class);
        adicionarParametro(design, "PAROQUIA_NOME", String.class);
        adicionarParametro(design, "EVENTO_LOCAL", String.class);
        adicionarParametro(design, "EVENTO_PERIODO", String.class);
        adicionarParametro(design, "EMITIDO_EM", String.class);
        adicionarParametro(design, "FILTROS", String.class);
        adicionarParametro(design, "TOTAL_REGISTROS", Integer.class);
    }

    private void adicionarParametro(JasperDesign design, String nome, Class<?> tipo) throws JRException {
        var parametro = new JRDesignParameter();
        parametro.setName(nome);
        parametro.setValueClass(tipo);
        design.addParameter(parametro);
    }

    private void adicionarCampos(JasperDesign design) throws JRException {
        adicionarCampo(design, "equipeApelido");
        adicionarCampo(design, "sobrinhoNome");
        adicionarCampo(design, "dupla");
        adicionarCampo(design, "tiosCarona");
        adicionarCampo(design, "status");
        adicionarCampo(design, "recebidoDaDuplaEm");
        adicionarCampo(design, "conferidoEm");
        adicionarCampo(design, "anexadoAoKitEm");
        adicionarCampo(design, "entregueAoSobrinhoEm");
        adicionarCampo(design, "observacao");
    }

    private void adicionarCampo(JasperDesign design, String nome) throws JRException {
        var campo = new JRDesignField();
        campo.setName(nome);
        campo.setValueClass(String.class);
        design.addField(campo);
    }

    private void adicionarTitulo(JasperDesign design) {
        var band = new JRDesignBand();
        band.setHeight(100);

        band.addElement(textoEstatico("Cadernos de Mensagens por equipe do kit", 0, 0, 802, 24, 16f, true, HorizontalTextAlignEnum.CENTER));

        band.addElement(campoTexto("\"Evento: \" + $P{EVENTO_NOME}", 0, 32, 802, 16, 10f, true));
        band.addElement(campoTexto("\"Paróquia: \" + $P{PAROQUIA_NOME}", 0, 50, 401, 14, 9f, false));
        band.addElement(campoTexto("\"Local: \" + $P{EVENTO_LOCAL}", 410, 50, 392, 14, 9f, false));
        band.addElement(campoTexto("\"Período: \" + $P{EVENTO_PERIODO}", 0, 66, 401, 14, 9f, false));
        band.addElement(campoTexto("\"Emitido em: \" + $P{EMITIDO_EM}", 410, 66, 392, 14, 9f, false));
        band.addElement(campoTexto("\"Filtros: \" + $P{FILTROS} + \" | Total: \" + $P{TOTAL_REGISTROS}", 0, 82, 802, 14, 9f, false));

        design.setTitle(band);
    }

    private void adicionarCabecalho(JasperDesign design) {
        var band = new JRDesignBand();
        band.setHeight(22);

        var fundo = new JRDesignRectangle();
        fundo.setX(0);
        fundo.setY(0);
        fundo.setWidth(802);
        fundo.setHeight(22);
        fundo.setBackcolor(new Color(229, 231, 235));
        fundo.setMode(ModeEnum.OPAQUE);
        band.addElement(fundo);

        band.addElement(textoEstatico("Equipe", 4, 4, 80, 14, 8f, true, HorizontalTextAlignEnum.LEFT));
        band.addElement(textoEstatico("Encontrista", 88, 4, 112, 14, 8f, true, HorizontalTextAlignEnum.LEFT));
        band.addElement(textoEstatico("Dupla", 204, 4, 85, 14, 8f, true, HorizontalTextAlignEnum.LEFT));
        band.addElement(textoEstatico("Tios carona", 293, 4, 150, 14, 8f, true, HorizontalTextAlignEnum.LEFT));
        band.addElement(textoEstatico("Status", 447, 4, 75, 14, 8f, true, HorizontalTextAlignEnum.LEFT));
        band.addElement(textoEstatico("Recebido", 526, 4, 60, 14, 8f, true, HorizontalTextAlignEnum.LEFT));
        band.addElement(textoEstatico("Conferido", 590, 4, 60, 14, 8f, true, HorizontalTextAlignEnum.LEFT));
        band.addElement(textoEstatico("No kit", 654, 4, 60, 14, 8f, true, HorizontalTextAlignEnum.LEFT));
        band.addElement(textoEstatico("Assinatura", 718, 4, 80, 14, 8f, true, HorizontalTextAlignEnum.LEFT));

        design.setColumnHeader(band);
    }

    private void adicionarDetalhe(JasperDesign design) {
        var band = new JRDesignBand();
        band.setHeight(32);

        band.addElement(campoTexto("$F{equipeApelido}", 4, 3, 80, 26, 7f, false));
        band.addElement(campoTexto("$F{sobrinhoNome}", 88, 3, 112, 26, 7f, false));
        band.addElement(campoTexto("$F{dupla}", 204, 3, 85, 26, 7f, false));
        band.addElement(campoTexto("$F{tiosCarona}", 293, 3, 150, 26, 7f, false));
        band.addElement(campoTexto("$F{status}", 447, 3, 75, 26, 7f, false));
        band.addElement(campoTexto("$F{recebidoDaDuplaEm}", 526, 3, 60, 26, 7f, false));
        band.addElement(campoTexto("$F{conferidoEm}", 590, 3, 60, 26, 7f, false));
        band.addElement(campoTexto("$F{anexadoAoKitEm}", 654, 3, 60, 26, 7f, false));

        var assinatura = new JRDesignLine();
        assinatura.setX(718);
        assinatura.setY(22);
        assinatura.setWidth(80);
        assinatura.setHeight(1);
        band.addElement(assinatura);

        var linha = new JRDesignLine();
        linha.setX(0);
        linha.setY(31);
        linha.setWidth(802);
        linha.setHeight(1);
        band.addElement(linha);

        ((JRDesignSection) design.getDetailSection()).addBand(band);
    }

    private void adicionarResumo(JasperDesign design) {
        var band = new JRDesignBand();
        band.setHeight(24);
        var total = campoTexto("\"Total de cadernos listados: \" + $P{TOTAL_REGISTROS}", 0, 6, 802, 14, 8f, false);
        total.setHorizontalTextAlign(HorizontalTextAlignEnum.RIGHT);
        band.addElement(total);
        design.setSummary(band);
    }

    private void adicionarRodape(JasperDesign design) {
        var band = new JRDesignBand();
        band.setHeight(20);

        band.addElement(campoTexto("\"Gerado pelo sistema Tio Carona\"", 0, 4, 401, 12, 7f, false));

        var pagina = campoTexto("\"Página \" + $V{PAGE_NUMBER}", 650, 4, 152, 12, 7f, false);
        pagina.setHorizontalTextAlign(HorizontalTextAlignEnum.RIGHT);
        band.addElement(pagina);

        design.setPageFooter(band);
    }

    private JRDesignStaticText textoEstatico(
            String texto,
            int x,
            int y,
            int largura,
            int altura,
            float tamanhoFonte,
            boolean negrito,
            HorizontalTextAlignEnum alinhamento
    ) {
        var elemento = new JRDesignStaticText();
        elemento.setX(x);
        elemento.setY(y);
        elemento.setWidth(largura);
        elemento.setHeight(altura);
        elemento.setText(texto);
        elemento.setFontSize(tamanhoFonte);
        elemento.setBold(negrito);
        elemento.setHorizontalTextAlign(alinhamento);
        elemento.setVerticalTextAlign(VerticalTextAlignEnum.MIDDLE);
        return elemento;
    }

    private JRDesignTextField campoTexto(
            String expressao,
            int x,
            int y,
            int largura,
            int altura,
            float tamanhoFonte,
            boolean negrito
    ) {
        var elemento = new JRDesignTextField();
        elemento.setX(x);
        elemento.setY(y);
        elemento.setWidth(largura);
        elemento.setHeight(altura);
        elemento.setFontSize(tamanhoFonte);
        elemento.setBold(negrito);
        elemento.setVerticalTextAlign(VerticalTextAlignEnum.TOP);

        var expression = new JRDesignExpression();
        expression.setText(expressao);
        elemento.setExpression(expression);

        return elemento;
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

    private String mensagemCurta(Exception ex) {
        if (ex.getMessage() == null || ex.getMessage().isBlank()) {
            return ex.getClass().getSimpleName();
        }

        return ex.getMessage();
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
