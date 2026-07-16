package br.com.paroquia.encontro.controllers;

import br.com.paroquia.encontro.domain.enums.StatusCadernoChoro;
import br.com.paroquia.encontro.services.RelatorioCadernoEquipeService;
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

    public RelatorioController(
            RelatorioCadernoEquipeService cadernoEquipeService,
            RelatorioListaPresencaService listaPresencaService
    ) {
        this.cadernoEquipeService = cadernoEquipeService;
        this.listaPresencaService = listaPresencaService;
    }

    @GetMapping(value = "/cadernos-equipes.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> cadernosEquipes(
            @PathVariable Long eventoId,
            @RequestParam(required = false) Long equipeId,
            @RequestParam(required = false) StatusCadernoChoro status
    ) {
        var pdf = cadernoEquipeService.gerarPdf(eventoId, equipeId, status);
        return pdfResponse(pdf, "cadernos-equipes-evento-" + eventoId + ".pdf");
    }

    @GetMapping(value = "/lista-presenca-encontristas.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> listaPresencaEncontristas(
            @PathVariable Long eventoId,
            @RequestParam(required = false, defaultValue = "true") Boolean somenteAtivos
    ) {
        var pdf = listaPresencaService.listaPresencaEncontristas(eventoId, somenteAtivos);
        return pdfResponse(pdf, "lista-presenca-encontristas-evento-" + eventoId + ".pdf");
    }

    @GetMapping(value = "/lista-presenca-tios-carona.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> listaPresencaTiosCarona(
            @PathVariable Long eventoId,
            @RequestParam(required = false, defaultValue = "true") Boolean somenteAtivos
    ) {
        var pdf = listaPresencaService.listaPresencaTiosCarona(eventoId, somenteAtivos);
        return pdfResponse(pdf, "lista-presenca-tios-carona-evento-" + eventoId + ".pdf");
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
