package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.Sobrinho;
import br.com.paroquia.encontro.domain.entity.SobrinhoPresenca;
import br.com.paroquia.encontro.domain.enums.OrigemPresencaSobrinho;
import br.com.paroquia.encontro.domain.enums.SobrinhoStatus;
import br.com.paroquia.encontro.dto.request.SobrinhoRequest;
import br.com.paroquia.encontro.dto.response.SobrinhoPresencaResponse;
import br.com.paroquia.encontro.dto.response.SobrinhoResponse;
import br.com.paroquia.encontro.domain.enums.OperacaoPresencaSobrinho;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.SobrinhoPresencaRepository;
import br.com.paroquia.encontro.repository.SobrinhoRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SobrinhoService {
    private final SobrinhoRepository repository;
    private final EventoRepository eventoRepository;
    private final SobrinhoPresencaRepository sobrinhoPresencaRepository;
    private final CredencialOperacionalService credencialOperacionalService;

    public SobrinhoService(
            SobrinhoRepository repository,
            EventoRepository eventoRepository,
            SobrinhoPresencaRepository sobrinhoPresencaRepository,
            CredencialOperacionalService credencialOperacionalService
    ) {
        this.repository = repository;
        this.eventoRepository = eventoRepository;
        this.sobrinhoPresencaRepository = sobrinhoPresencaRepository;
        this.credencialOperacionalService = credencialOperacionalService;
    }

    @Transactional(readOnly = true)
    public List<SobrinhoResponse> listar(Long eventoId) {
        return repository.findByEventoIdOrderByNome(eventoId)
                .stream()
                .map(sobrinho -> SobrinhoResponse.from(
                        sobrinho,
                        sobrinhoPresencaRepository
                                .findFirstBySobrinhoIdOrderByOcorridoEmDesc(sobrinho.getId())
                                .orElse(null)
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SobrinhoPresencaResponse> listarPresencas(Long eventoId, Long sobrinhoId) {
        buscarPorIdEvento(eventoId, sobrinhoId);

        return sobrinhoPresencaRepository.findBySobrinhoIdOrderByOcorridoEmDesc(sobrinhoId)
                .stream()
                .map(SobrinhoPresencaResponse::from)
                .toList();
    }

    @Transactional
    public SobrinhoResponse criar(Long eventoId, SobrinhoRequest request) {
        var evento = eventoRepository.findById(eventoId).orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));
        return SobrinhoResponse.from(repository.save(new Sobrinho(evento, request.nome(), request.telefone(), request.responsavelNome(), request.responsavelTelefone(), request.endereco(), request.dataNascimento(), request.restricaoAlimentar(), request.observacaoMedica())));
    }

    @Transactional
    public SobrinhoResponse registrarPresenca(
            Long eventoId,
            Long sobrinhoId,
            OperacaoPresencaSobrinho operacao,
            String observacao
    ) {
        var sobrinho = buscarPorIdEvento(eventoId, sobrinhoId);

        var novoStatus = switch (operacao) {
            case PRESENTE -> SobrinhoStatus.PRESENTE;
            case AUSENTE -> SobrinhoStatus.AUSENTE;
            case DESISTENTE -> SobrinhoStatus.DESISTENTE;
        };

        var presenca = sobrinhoPresencaRepository.save(new SobrinhoPresenca(
                sobrinho.getEvento(),
                sobrinho,
                novoStatus,
                OrigemPresencaSobrinho.MANUAL,
                observacao
        ));

        sobrinho.atualizarStatusPresenca(novoStatus);

        return SobrinhoResponse.from(sobrinho, presenca);
    }

    @Transactional
    public SobrinhoResponse registrarPresencaPorCredencial(
            Long eventoId,
            String codigoIdentificacao,
            OperacaoPresencaSobrinho operacao,
            String observacao
    ) {
        var sobrinho = credencialOperacionalService.resolverSobrinhoPorCredencial(
                eventoId,
                codigoIdentificacao
        );

        return registrarPresenca(eventoId, sobrinho.getId(), operacao, observacao);
    }

    private Sobrinho buscarPorIdEvento(Long eventoId, Long sobrinhoId) {
        return repository.findByIdAndEventoId(sobrinhoId, eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Sobrinho não encontrado neste evento."));
    }
}
