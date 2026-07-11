package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.CredencialEvento;
import br.com.paroquia.encontro.domain.enums.SobrinhoStatus;
import br.com.paroquia.encontro.domain.enums.StatusCredencial;
import br.com.paroquia.encontro.domain.enums.TipoCredencial;
import br.com.paroquia.encontro.dto.response.CredencialEventoResponse;
import br.com.paroquia.encontro.dto.response.CredencialGeracaoResponse;
import br.com.paroquia.encontro.repository.CredencialEventoRepository;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.SobrinhoRepository;
import br.com.paroquia.encontro.repository.TioCaronaEventoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CredencialEventoService {
    private final CredencialEventoRepository repository;
    private final EventoRepository eventoRepository;
    private final TioCaronaEventoRepository tioCaronaEventoRepository;
    private final SobrinhoRepository sobrinhoRepository;

    public CredencialEventoService(
            CredencialEventoRepository repository,
            EventoRepository eventoRepository,
            TioCaronaEventoRepository tioCaronaEventoRepository,
            SobrinhoRepository sobrinhoRepository
    ) {
        this.repository = repository;
        this.eventoRepository = eventoRepository;
        this.tioCaronaEventoRepository = tioCaronaEventoRepository;
        this.sobrinhoRepository = sobrinhoRepository;
    }

    @Transactional
    public CredencialGeracaoResponse gerarCredenciaisTios(Long eventoId) {
        var evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));

        var tios = tioCaronaEventoRepository.findByEventoIdOrderByPessoaNomeAsc(eventoId);

        long criadas = 0;
        long existentes = 0;

        for (var tio : tios) {
            if (repository.existsByEventoIdAndTioCaronaEventoId(eventoId, tio.getId())) {
                existentes++;
                continue;
            }

            var codigo = gerarCodigoUnico("TC", eventoId, tio.getId());

            repository.save(CredencialEvento.paraTioCarona(
                    evento,
                    tio,
                    codigo
            ));

            criadas++;
        }

        return new CredencialGeracaoResponse(
                eventoId,
                criadas,
                existentes,
                repository.countByEventoIdAndTipo(eventoId, TipoCredencial.TIO_CARONA)
        );
    }

    @Transactional
    public CredencialGeracaoResponse gerarCredenciaisSobrinhos(Long eventoId) {
        var evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));

        var sobrinhos = sobrinhoRepository.findByEventoIdOrderByNomeAsc(eventoId);

        long criadas = 0;
        long existentes = 0;

        for (var sobrinho : sobrinhos) {
            if (sobrinho.getStatus() == SobrinhoStatus.DESISTENTE) {
                continue;
            }

            if (repository.existsByEventoIdAndSobrinhoId(eventoId, sobrinho.getId())) {
                existentes++;
                continue;
            }

            var codigo = gerarCodigoUnico("SB", eventoId, sobrinho.getId());

            repository.save(CredencialEvento.paraSobrinho(
                    evento,
                    sobrinho,
                    codigo
            ));

            criadas++;
        }

        return new CredencialGeracaoResponse(
                eventoId,
                criadas,
                existentes,
                repository.countByEventoIdAndTipo(eventoId, TipoCredencial.SOBRINHO)
        );
    }

    @Transactional
    public CredencialGeracaoResponse gerarTodas(Long eventoId) {
        var tios = gerarCredenciaisTios(eventoId);
        var sobrinhos = gerarCredenciaisSobrinhos(eventoId);

        return new CredencialGeracaoResponse(
                eventoId,
                tios.criadas() + sobrinhos.criadas(),
                tios.existentes() + sobrinhos.existentes(),
                repository.countByEventoId(eventoId)
        );
    }

    @Transactional(readOnly = true)
    public List<CredencialEventoResponse> listar(Long eventoId, TipoCredencial tipo) {
        var credenciais = tipo == null
                ? repository.findByEventoIdOrderByTipoAscCodigoAsc(eventoId)
                : repository.findByEventoIdAndTipoOrderByCodigoAsc(eventoId, tipo);

        return credenciais.stream()
                .map(CredencialEventoResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CredencialEventoResponse buscarPorCodigo(String codigo) {
        return repository.findByCodigo(codigo)
                .map(CredencialEventoResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Credencial não encontrada."));
    }

    @Transactional
    public CredencialEventoResponse inativar(Long eventoId, Long credencialId) {
        var credencial = buscarEntidade(eventoId, credencialId);
        credencial.inativar();

        return CredencialEventoResponse.from(credencial);
    }

    @Transactional
    public CredencialEventoResponse reativar(Long eventoId, Long credencialId) {
        var credencial = buscarEntidade(eventoId, credencialId);
        credencial.reativar();

        return CredencialEventoResponse.from(credencial);
    }

    @Transactional
    public CredencialEventoResponse cancelar(Long eventoId, Long credencialId) {
        var credencial = buscarEntidade(eventoId, credencialId);
        credencial.cancelar();

        return CredencialEventoResponse.from(credencial);
    }

    @Transactional
    public CredencialEventoResponse reemitir(Long eventoId, Long credencialId) {
        var credencial = buscarEntidade(eventoId, credencialId);

        var referenciaId = credencial.getTipo() == TipoCredencial.TIO_CARONA
                ? credencial.getTioCaronaEvento().getId()
                : credencial.getSobrinho().getId();

        var prefixo = credencial.getTipo() == TipoCredencial.TIO_CARONA ? "TC" : "SB";
        var novoCodigo = gerarCodigoReemitido(prefixo, eventoId, referenciaId);

        credencial.reemitir(novoCodigo);

        return CredencialEventoResponse.from(credencial);
    }

    private CredencialEvento buscarEntidade(Long eventoId, Long credencialId) {
        return repository.findByIdAndEventoId(credencialId, eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Credencial não encontrada neste evento."));
    }

    private String gerarCodigoUnico(String prefixo, Long eventoId, Long referenciaId) {
        var codigoBase = "%s-E%04d-%06d".formatted(prefixo, eventoId, referenciaId);

        if (!repository.existsByCodigo(codigoBase)) {
            return codigoBase;
        }

        for (int tentativa = 1; tentativa <= 99; tentativa++) {
            var codigo = "%s-%02d".formatted(codigoBase, tentativa);

            if (!repository.existsByCodigo(codigo)) {
                return codigo;
            }
        }

        throw new BusinessException("Não foi possível gerar código único para a credencial.");
    }

    private String gerarCodigoReemitido(String prefixo, Long eventoId, Long referenciaId) {
        var codigoBase = "%s-E%04d-%06d".formatted(prefixo, eventoId, referenciaId);

        for (int tentativa = 1; tentativa <= 99; tentativa++) {
            var codigo = "%s-R%02d".formatted(codigoBase, tentativa);

            if (!repository.existsByCodigo(codigo)) {
                return codigo;
            }
        }

        throw new BusinessException("Não foi possível gerar novo código para reemissão da credencial.");
    }
}