package br.com.paroquia.encontro.controllers;

import br.com.paroquia.encontro.domain.enums.ModeloCarteirinhaCredencial;
import br.com.paroquia.encontro.domain.enums.ModeloCrachaCredencial;
import br.com.paroquia.encontro.domain.enums.ModeloEtiquetaQr;
import br.com.paroquia.encontro.domain.enums.StatusCadernoChoro;
import br.com.paroquia.encontro.domain.enums.StatusCredencial;
import br.com.paroquia.encontro.domain.enums.TipoCredencial;
import br.com.paroquia.encontro.services.RelatorioCadernoEquipeService;
import br.com.paroquia.encontro.services.RelatorioCarteirinhaCredencialService;
import br.com.paroquia.encontro.services.RelatorioCrachaCredencialService;
import br.com.paroquia.encontro.services.RelatorioEtiquetaQrService;
import br.com.paroquia.encontro.services.RelatorioListaPresencaService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/eventos/{eventoId}/relatorios")
public class RelatorioController {
    private final RelatorioCadernoEquipeService cadernoEquipeService;
    private final RelatorioListaPresencaService listaPresencaService;
    private final RelatorioEtiquetaQrService etiquetaQrService;
    private final RelatorioCrachaCredencialService crachaCredencialService;
    private final RelatorioCarteirinhaCredencialService carteirinhaCredencialService;

    public RelatorioController(
            RelatorioCadernoEquipeService cadernoEquipeService,
            RelatorioListaPresencaService listaPresencaService,
            RelatorioEtiquetaQrService etiquetaQrService,
            RelatorioCrachaCredencialService crachaCredencialService,
            RelatorioCarteirinhaCredencialService carteirinhaCredencialService
    ) {
        this.cadernoEquipeService = cadernoEquipeService;
        this.listaPresencaService = listaPresencaService;
        this.etiquetaQrService = etiquetaQrService;
        this.crachaCredencialService = crachaCredencialService;
        this.carteirinhaCredencialService = carteirinhaCredencialService;
    }

    @GetMapping(value = "/cadernos-equipes.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> cadernosEquipes(
            @PathVariable Long eventoId,
            @RequestParam(required = false) Long equipeId,
            @RequestParam(required = false) Long duplaId,
            @RequestParam(required = false) StatusCadernoChoro status
    ) {
        var pdf = cadernoEquipeService.gerarPdf(eventoId, equipeId, duplaId, status);
        return pdfResponse(pdf, "cadernos-equipes-evento-" + eventoId + ".pdf");
    }

    @GetMapping(value = "/lista-presenca-encontristas.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> listaPresencaEncontristas(
            @PathVariable Long eventoId,
            @RequestParam(required = false, defaultValue = "true") Boolean somenteAtivos,
            @RequestParam(required = false) Long duplaId
    ) {
        var pdf = listaPresencaService.listaPresencaEncontristas(eventoId, somenteAtivos, duplaId);
        return pdfResponse(pdf, "lista-presenca-encontristas-evento-" + eventoId + ".pdf");
    }

    @GetMapping(value = "/lista-presenca-tios-carona.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> listaPresencaTiosCarona(
            @PathVariable Long eventoId,
            @RequestParam(required = false, defaultValue = "true") Boolean somenteAtivos,
            @RequestParam(required = false) Long duplaId
    ) {
        var pdf = listaPresencaService.listaPresencaTiosCarona(eventoId, somenteAtivos, duplaId);
        return pdfResponse(pdf, "lista-presenca-tios-carona-evento-" + eventoId + ".pdf");
    }


    @GetMapping(value = "/etiquetas-qr-code.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> etiquetasQrCode(
            @PathVariable Long eventoId,
            @RequestParam(required = false, defaultValue = "A4_3_COLUNAS_24") ModeloEtiquetaQr modelo,
            @RequestParam(required = false) TipoCredencial tipo,
            @RequestParam(required = false) StatusCredencial status
    ) {
        var pdf = etiquetaQrService.gerarEtiquetasQr(eventoId, modelo, tipo, status);
        return pdfResponse(pdf, "etiquetas-qr-code-evento-" + eventoId + ".pdf");
    }


    @GetMapping(value = "/crachas-credenciais.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> crachasCredenciais(
            @PathVariable Long eventoId,
            @RequestParam(required = false, defaultValue = "A4_2_COLUNAS_4") ModeloCrachaCredencial modelo,
            @RequestParam(required = false) TipoCredencial tipo,
            @RequestParam(required = false) StatusCredencial status
    ) {
        var pdf = crachaCredencialService.gerarCrachas(eventoId, modelo, tipo, status);
        return pdfResponse(pdf, "crachas-credenciais-evento-" + eventoId + ".pdf");
    }


    @GetMapping(value = "/carteirinhas-credenciais.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> carteirinhasCredenciais(
            @PathVariable Long eventoId,
            @RequestParam(required = false, defaultValue = "A4_10_CARTEIRINHAS") ModeloCarteirinhaCredencial modelo,
            @RequestParam(required = false) TipoCredencial tipo,
            @RequestParam(required = false) StatusCredencial status
    ) {
        var pdf = carteirinhaCredencialService.gerarCarteirinhas(eventoId, modelo, tipo, status);
        return pdfResponse(pdf, "carteirinhas-credenciais-evento-" + eventoId + ".pdf");
    }

    private ResponseEntity<byte[]> pdfResponse(byte[] pdf, String filename) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline()
                                .filename(filename, StandardCharsets.UTF_8)
                                .build()
                                .toString()
                )
                .body(pdf);
    }
}
