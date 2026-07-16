package br.com.paroquia.encontro.controllers;

import br.com.paroquia.encontro.dto.response.DashboardResumoResponse;
import br.com.paroquia.encontro.services.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping("/resumo")
    public DashboardResumoResponse resumo(@RequestParam(required = false) Long eventoId) {
        return service.resumo(eventoId);
    }
}
