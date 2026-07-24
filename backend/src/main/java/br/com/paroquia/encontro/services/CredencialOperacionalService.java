package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.CredencialEvento;
import br.com.paroquia.encontro.domain.entity.Sobrinho;
import br.com.paroquia.encontro.domain.entity.TioCaronaEvento;
import br.com.paroquia.encontro.domain.enums.StatusCredencial;
import br.com.paroquia.encontro.domain.enums.TipoCredencial;
import br.com.paroquia.encontro.repository.CredencialEventoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class CredencialOperacionalService {
    private final CredencialEventoRepository credencialRepository;

    public CredencialOperacionalService(CredencialEventoRepository credencialRepository) {
        this.credencialRepository = credencialRepository;
    }


    @Transactional(readOnly = true)
    public Optional<CredencialEvento> buscarCredencialTioCarona(Long eventoId, Long tioCaronaEventoId) {
        return credencialRepository.findByEventoIdAndTioCaronaEventoId(eventoId, tioCaronaEventoId);
    }

    @Transactional(readOnly = true)
    public TioCaronaEvento resolverTioCaronaPorCredencial(Long eventoId, String codigo) {
        var credencial = buscarCredencialAtivaDoEvento(eventoId, codigo);

        if (credencial.getTipo() != TipoCredencial.TIO_CARONA) {
            throw new BusinessException("A credencial informada não pertence a um tio carona.");
        }

        if (credencial.getTioCaronaEvento() == null) {
            throw new BusinessException("Credencial de tio carona sem vínculo operacional.");
        }

        return credencial.getTioCaronaEvento();
    }

    @Transactional(readOnly = true)
    public Sobrinho resolverSobrinhoPorCredencial(Long eventoId, String codigo) {
        var credencial = buscarCredencialAtivaDoEvento(eventoId, codigo);

        if (credencial.getTipo() != TipoCredencial.SOBRINHO) {
            throw new BusinessException("A credencial informada não pertence a um sobrinho.");
        }

        if (credencial.getSobrinho() == null) {
            throw new BusinessException("Credencial de sobrinho sem vínculo operacional.");
        }

        return credencial.getSobrinho();
    }

    @Transactional(readOnly = true)
    public boolean existeCredencialComCodigo(String codigo) {
        return credencialRepository.findByCodigo(normalizarCodigo(codigo)).isPresent();
    }

    private CredencialEvento buscarCredencialAtivaDoEvento(Long eventoId, String codigo) {
        var codigoNormalizado = normalizarCodigo(codigo);

        var credencial = credencialRepository.findByCodigo(codigoNormalizado)
                .orElseThrow(() -> new ResourceNotFoundException("Credencial não encontrada."));

        if (!credencial.getEvento().getId().equals(eventoId)) {
            throw new BusinessException("Credencial não pertence ao evento informado.");
        }

        if (credencial.getStatus() != StatusCredencial.ATIVA) {
            throw new BusinessException("Credencial não está ativa.");
        }

        return credencial;
    }

    private String normalizarCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            throw new BusinessException("Código da credencial é obrigatório.");
        }

        var codigoNormalizado = codigo
                .trim()
                .replaceAll("\\s+", "")
                .toUpperCase(java.util.Locale.ROOT);

        if (codigoNormalizado.length() > 80) {
            throw new BusinessException(
                    "Código da credencial deve ter no máximo 80 caracteres."
            );
        }

        if (!codigoNormalizado.matches("[A-Z0-9_-]+")) {
            throw new BusinessException(
                    "Código da credencial possui caracteres inválidos."
            );
        }

        if (!codigoNormalizado.matches(
                "(TC|SB)-E\\d{4,}-\\d{6}(?:-R\\d{2})?"
        )) {
            throw new BusinessException(
                    "Formato da credencial é inválido."
            );
        }

        return codigoNormalizado;
    }
}
