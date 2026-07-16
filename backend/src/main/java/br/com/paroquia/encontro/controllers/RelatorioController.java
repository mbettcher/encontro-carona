package br.com.paroquia.encontro.controllers;

import br.com.paroquia.encontro.domain.enums.StatusCadernoChoro;
import br.com.paroquia.encontro.services.RelatorioCadernoEquipeService;
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

    public RelatorioController(RelatorioCadernoEquipeService cadernoEquipeService) {
        this.cadernoEquipeService = cadernoEquipeService;
    }

    @GetMapping(value = "/cadernos-equipes.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> cadernosEquipes(
            @PathVariable Long eventoId,
            @RequestParam(required = false) Long equipeId,
            @RequestParam(required = false) StatusCadernoChoro status
    ) {
        var pdf = cadernoEquipeService.gerarPdf(eventoId, equipeId, status);
        var filename = "cadernos-equipes-evento-" + eventoId + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                        .filename(filename, StandardCharsets.UTF_8)
                        .build()
                        .toString())
                .body(pdf);
    }
}
