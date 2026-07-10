package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.TioCaronaEvento;
import br.com.paroquia.encontro.domain.entity.TioCaronaEventoOperacao;
import br.com.paroquia.encontro.domain.enums.OrigemOperacaoTioCarona;
import br.com.paroquia.encontro.domain.enums.TipoOperacaoTioCarona;
import br.com.paroquia.encontro.domain.enums.TioCaronaStatus;
import br.com.paroquia.encontro.dto.request.TioCaronaEventoRequest;
import br.com.paroquia.encontro.dto.response.TioCaronaEventoOperacaoResponse;
import br.com.paroquia.encontro.dto.response.TioCaronaEventoResponse;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.PessoaRepository;
import br.com.paroquia.encontro.repository.TioCaronaEventoOperacaoRepository;
import br.com.paroquia.encontro.repository.TioCaronaEventoRepository;
import br.com.paroquia.encontro.dto.request.AtualizarTioCaronaEventoRequest;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TioCaronaEventoService {
    private final TioCaronaEventoRepository repository;
    private final TioCaronaEventoOperacaoRepository operacaoRepository;
    private final EventoRepository eventoRepository;
    private final PessoaRepository pessoaRepository;
    private final CredencialOperacionalService credencialOperacionalService;

    public TioCaronaEventoService(
            TioCaronaEventoRepository repository,
            TioCaronaEventoOperacaoRepository operacaoRepository,
            EventoRepository eventoRepository,
            PessoaRepository pessoaRepository,
            CredencialOperacionalService credencialOperacionalService
    ) {
        this.repository = repository;
        this.operacaoRepository = operacaoRepository;
        this.eventoRepository = eventoRepository;
        this.pessoaRepository = pessoaRepository;
        this.credencialOperacionalService = credencialOperacionalService;
    }

    @Transactional(readOnly = true)
    public List<TioCaronaEventoResponse> listar(Long eventoId) {
        return repository.findByEventoIdOrderByPessoaNome(eventoId)
                .stream()
                .map(tio -> TioCaronaEventoResponse.from(
                        tio,
                        operacaoRepository
                                .findFirstByTioCaronaEventoIdOrderByOcorridoEmDesc(tio.getId())
                                .orElse(null)
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TioCaronaEventoOperacaoResponse> listarOperacoes(Long eventoId, Long tioCaronaEventoId) {
        buscarPorIdEvento(eventoId, tioCaronaEventoId);

        return operacaoRepository.findByTioCaronaEventoIdOrderByOcorridoEmDesc(tioCaronaEventoId)
                .stream()
                .map(TioCaronaEventoOperacaoResponse::from)
                .toList();
    }

    @Transactional
    public TioCaronaEventoResponse adicionar(Long eventoId, TioCaronaEventoRequest request) {
        if (repository.existsByEventoIdAndPessoaId(eventoId, request.pessoaId())) {
            throw new BusinessException("Esta pessoa já está cadastrada como tio carona neste evento.");
        }

        var evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));

        var pessoa = pessoaRepository.findById(request.pessoaId())
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada."));

        var entity = new TioCaronaEvento(evento, pessoa, request.observacoes());

        return TioCaronaEventoResponse.from(repository.save(entity));
    }

    @Transactional
    public TioCaronaEventoResponse registrarCheckinPorCodigo(Long eventoId, String codigoIdentificacao) {
        var tioCarona = resolverTioPorCodigoOuCredencial(eventoId, codigoIdentificacao);
        return registrarOperacao(
                tioCarona,
                TipoOperacaoTioCarona.CHECKIN,
                OrigemOperacaoTioCarona.CREDENCIAL,
                codigoIdentificacao
        );
    }

    @Transactional
    public TioCaronaEventoResponse registrarCheckoutPorCodigo(Long eventoId, String codigoIdentificacao) {
        var tioCarona = resolverTioPorCodigoOuCredencial(eventoId, codigoIdentificacao);
        return registrarOperacao(
                tioCarona,
                TipoOperacaoTioCarona.CHECKOUT,
                OrigemOperacaoTioCarona.CREDENCIAL,
                codigoIdentificacao
        );
    }

    @Transactional
    public TioCaronaEventoResponse registrarCheckinManual(Long eventoId, Long tioCaronaEventoId) {
        var tioCarona = buscarPorIdEvento(eventoId, tioCaronaEventoId);
        return registrarOperacao(tioCarona, TipoOperacaoTioCarona.CHECKIN, OrigemOperacaoTioCarona.MANUAL, null);
    }

    @Transactional
    public TioCaronaEventoResponse registrarCheckoutManual(Long eventoId, Long tioCaronaEventoId) {
        var tioCarona = buscarPorIdEvento(eventoId, tioCaronaEventoId);
        return registrarOperacao(tioCarona, TipoOperacaoTioCarona.CHECKOUT, OrigemOperacaoTioCarona.MANUAL, null);
    }

    @Transactional
    public TioCaronaEventoResponse atualizar(
            Long eventoId,
            Long tioCaronaEventoId,
            AtualizarTioCaronaEventoRequest request
    ) {
        var tioCarona = buscarPorIdEvento(eventoId, tioCaronaEventoId);

        tioCarona.atualizarObservacoes(request.observacoes());

        var ultimaOperacao = operacaoRepository
                .findFirstByTioCaronaEventoIdOrderByOcorridoEmDesc(tioCarona.getId())
                .orElse(null);

        return TioCaronaEventoResponse.from(tioCarona, ultimaOperacao);
    }

    private TioCaronaEventoResponse registrarOperacao(
            TioCaronaEvento tioCarona,
            TipoOperacaoTioCarona tipo,
            OrigemOperacaoTioCarona origem,
            String codigoIdentificacao
    ) {
        validarAtivo(tioCarona);

        var ultimaOperacao = operacaoRepository
                .findFirstByTioCaronaEventoIdOrderByOcorridoEmDesc(tioCarona.getId())
                .orElse(null);

        validarSequencia(tipo, ultimaOperacao);

        var operacao = operacaoRepository.save(new TioCaronaEventoOperacao(
                tioCarona.getEvento(),
                tioCarona,
                tipo,
                origem,
                codigoIdentificacao == null ? null : codigoIdentificacao.trim()
        ));

        /*
         * Mantemos atualização dos campos antigos como resumo/compatibilidade.
         * O histórico passa a ser a fonte principal da operação.
         */
        if (tipo == TipoOperacaoTioCarona.CHECKIN) {
            tioCarona.registrarCheckinResumo(operacao.getOcorridoEm());
        } else {
            tioCarona.registrarCheckoutResumo(operacao.getOcorridoEm());
        }

        return TioCaronaEventoResponse.from(tioCarona, operacao);
    }

    private void validarSequencia(
            TipoOperacaoTioCarona tipo,
            TioCaronaEventoOperacao ultimaOperacao
    ) {
        if (ultimaOperacao == null) {
            if (tipo == TipoOperacaoTioCarona.CHECKOUT) {
                throw new BusinessException("Não é possível realizar checkout sem check-in.");
            }

            return;
        }

        if (ultimaOperacao.getTipo() == TipoOperacaoTioCarona.CHECKIN && tipo == TipoOperacaoTioCarona.CHECKIN) {
            throw new BusinessException("Já existe check-in em aberto para este tio carona.");
        }

        if (ultimaOperacao.getTipo() == TipoOperacaoTioCarona.CHECKOUT && tipo == TipoOperacaoTioCarona.CHECKOUT) {
            throw new BusinessException("Já existe checkout como última operação deste tio carona.");
        }
    }

    private void validarAtivo(TioCaronaEvento tioCarona) {
        if (tioCarona.getStatus() != TioCaronaStatus.ATIVO) {
            throw new BusinessException("Tio carona inativo não pode realizar operação.");
        }
    }

    private TioCaronaEvento buscarPorIdEvento(Long eventoId, Long tioCaronaEventoId) {
        return repository.findByIdAndEventoId(tioCaronaEventoId, eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Tio carona não encontrado neste evento."));
    }

    private TioCaronaEvento resolverTioPorCodigoOuCredencial(Long eventoId, String codigoIdentificacao) {
        var codigo = normalizarCodigoIdentificacao(codigoIdentificacao);

        if (credencialOperacionalService.existeCredencialComCodigo(codigo)) {
            return credencialOperacionalService.resolverTioCaronaPorCredencial(eventoId, codigo);
        }

        return repository.findByEventoIdAndCodigoIdentificacao(eventoId, codigo)
                .orElseThrow(() -> new ResourceNotFoundException("Tio carona não encontrado para o código informado."));
    }

    private String normalizarCodigoIdentificacao(String codigoIdentificacao) {
        if (codigoIdentificacao == null || codigoIdentificacao.isBlank()) {
            throw new BusinessException("Código de identificação é obrigatório.");
        }

        return codigoIdentificacao.trim();
    }
}