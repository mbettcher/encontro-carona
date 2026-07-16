package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JRParameter;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class JasperReportService {
    private static final Logger log = LoggerFactory.getLogger(JasperReportService.class);

    private final Map<String, JasperReport> cache = new ConcurrentHashMap<>();

    public byte[] gerarPdf(String jrxmlClasspath, Map<String, Object> parametros, List<?> dados) {
        try {
            var parametrosRelatorio = new HashMap<String, Object>(parametros);
            parametrosRelatorio.putIfAbsent(JRParameter.REPORT_LOCALE, Locale.of("pt", "BR"));

            var jasperReport = cache.computeIfAbsent(jrxmlClasspath, this::compilarRelatorio);
            var dataSource = new JRBeanCollectionDataSource(dados);
            var jasperPrint = JasperFillManager.fillReport(jasperReport, parametrosRelatorio, dataSource);

            return JasperExportManager.exportReportToPdf(jasperPrint);
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Erro ao gerar PDF Jasper. template={}", jrxmlClasspath, ex);
            throw new BusinessException("Não foi possível gerar o PDF Jasper: " + mensagemCurta(ex));
        }
    }

    private JasperReport compilarRelatorio(String jrxmlClasspath) {
        try (InputStream inputStream = getClass().getResourceAsStream(jrxmlClasspath)) {
            if (inputStream == null) {
                throw new BusinessException("Template JRXML não encontrado: " + jrxmlClasspath);
            }

            return JasperCompileManager.compileReport(inputStream);
        } catch (BusinessException ex) {
            throw ex;
        } catch (JRException ex) {
            log.error("Erro ao compilar template JRXML. template={}", jrxmlClasspath, ex);
            throw new BusinessException("Erro ao compilar template JRXML: " + mensagemCurta(ex));
        } catch (Exception ex) {
            log.error("Erro inesperado ao carregar template JRXML. template={}", jrxmlClasspath, ex);
            throw new BusinessException("Erro inesperado ao carregar template JRXML: " + mensagemCurta(ex));
        }
    }

    private String mensagemCurta(Exception ex) {
        if (ex.getMessage() == null || ex.getMessage().isBlank()) {
            return ex.getClass().getSimpleName();
        }

        return ex.getMessage();
    }
}
