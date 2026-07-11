package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.CadernoChoro;
import br.com.paroquia.encontro.domain.entity.CadernoChoroHistorico;
import br.com.paroquia.encontro.domain.enums.StatusCadernoChoro;
import br.com.paroquia.encontro.domain.enums.VinculoStatus;
import br.com.paroquia.encontro.dto.response.CadernoChoroGeracaoResponse;
import br.com.paroquia.encontro.dto.response.CadernoChoroHistoricoResponse;
import br.com.paroquia.encontro.dto.response.CadernoChoroResponse;
import br.com.paroquia.encontro.repository.CadernoChoroHistoricoRepository;
import br.com.paroquia.encontro.repository.CadernoChoroRepository;
import br.com.paroquia.encontro.repository.DuplaTioCaronaRepository;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.SobrinhoDuplaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CadernoChoroService {
    private final CadernoChoroRepository repository;
    private final CadernoChoroHistoricoRepository historicoRepository;
    private final EventoRepository eventoRepository;
    private final DuplaTioCaronaRepository duplaRepository;
    private final SobrinhoDuplaRepository sobrinhoDuplaRepository;

    public CadernoChoroService(CadernoChoroRepository repository, CadernoChoroHistoricoRepository historicoRepository, EventoRepository eventoRepository, DuplaTioCaronaRepository duplaRepository, SobrinhoDuplaRepository sobrinhoDuplaRepository) {
        this.repository = repository;
        this.historicoRepository = historicoRepository;
        this.eventoRepository = eventoRepository;
        this.duplaRepository = duplaRepository;
        this.sobrinhoDuplaRepository = sobrinhoDuplaRepository;
    }

    @Transactional
    public CadernoChoroGeracaoResponse gerar(Long eventoId) {
        var evento = eventoRepository.findById(eventoId).orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));

        var vinculosAtivos = sobrinhoDuplaRepository.findByEventoIdAndStatusOrderByDuplaCodigoAscSobrinhoNomeAsc(eventoId, VinculoStatus.ATIVO);

        long criados = 0;
        long existentes = 0;

        for (var vinculo : vinculosAtivos) {
            var sobrinho = vinculo.getSobrinho();

            if (repository.existsByEventoIdAndSobrinhoId(eventoId, sobrinho.getId())) {
                existentes++;
                continue;
            }

            var caderno = repository.save(new CadernoChoro(evento, vinculo.getDupla(), sobrinho));

            historicoRepository.save(new CadernoChoroHistorico(caderno, StatusCadernoChoro.PENDENTE, "Caderno de Mensagens gerado automaticamente a partir do vínculo ativo com a dupla."));

            criados++;
        }

        return new CadernoChoroGeracaoResponse(eventoId, criados, existentes, repository.countByEventoId(eventoId));
    }

    @Transactional(readOnly = true)
    public List<CadernoChoroResponse> listar(Long eventoId) {
        return repository.findByEventoIdOrderByDuplaCodigoAscSobrinhoNomeAsc(eventoId).stream().map(CadernoChoroResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<CadernoChoroResponse> listarPorDupla(Long eventoId, Long duplaId) {
        validarDuplaNoEvento(eventoId, duplaId);

        return repository.findByEventoIdAndDuplaIdOrderBySobrinhoNomeAsc(eventoId, duplaId).stream().map(CadernoChoroResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<CadernoChoroHistoricoResponse> listarHistorico(Long eventoId, Long cadernoId) {
        buscarCaderno(eventoId, cadernoId);

        return historicoRepository.findByCadernoIdOrderByOcorridoEmDesc(cadernoId).stream().map(CadernoChoroHistoricoResponse::from).toList();
    }

    @Transactional
    public List<CadernoChoroResponse> entregarADupla(Long eventoId, Long duplaId, String observacao) {
        validarDuplaNoEvento(eventoId, duplaId);

        var cadernos = repository.findByEventoIdAndDuplaIdAndStatusIn(eventoId, duplaId, List.of(StatusCadernoChoro.PENDENTE));

        if (cadernos.isEmpty()) {
            throw new BusinessException("Não há Cadernos de Mensagens pendentes para entregar a esta dupla.");
        }

        cadernos.forEach(caderno -> {
            caderno.entregarADupla(observacao);
            registrarHistorico(caderno, observacao);
        });

        return cadernos.stream().map(CadernoChoroResponse::from).toList();
    }

    @Transactional
    public List<CadernoChoroResponse> receberDaDupla(Long eventoId, Long duplaId, String observacao) {
        validarDuplaNoEvento(eventoId, duplaId);

        var cadernos = repository.findByEventoIdAndDuplaIdAndStatusIn(eventoId, duplaId, List.of(StatusCadernoChoro.ENTREGUE_A_DUPLA));

        if (cadernos.isEmpty()) {
            throw new BusinessException("Não há Cadernos de Mensagens entregues à dupla para receber de volta.");
        }

        cadernos.forEach(caderno -> {
            caderno.receberDaDupla(observacao);
            registrarHistorico(caderno, observacao);
        });

        return cadernos.stream().map(CadernoChoroResponse::from).toList();
    }

    @Transactional
    public CadernoChoroResponse conferir(Long eventoId, Long cadernoId, String observacao) {
        var caderno = buscarCaderno(eventoId, cadernoId);
        caderno.conferir(observacao);
        registrarHistorico(caderno, observacao);

        return CadernoChoroResponse.from(caderno);
    }

    @Transactional
    public CadernoChoroResponse anexarAoKit(Long eventoId, Long cadernoId, String observacao) {
        var caderno = buscarCaderno(eventoId, cadernoId);
        caderno.anexarAoKit(observacao);
        registrarHistorico(caderno, observacao);

        return CadernoChoroResponse.from(caderno);
    }

    @Transactional
    public CadernoChoroResponse entregarAoSobrinho(Long eventoId, Long cadernoId, String observacao) {
        var caderno = buscarCaderno(eventoId, cadernoId);
        caderno.entregarAoSobrinho(observacao);
        registrarHistorico(caderno, observacao);

        return CadernoChoroResponse.from(caderno);
    }

    @Transactional
    public CadernoChoroResponse marcarPerdido(Long eventoId, Long cadernoId, String observacao) {
        var caderno = buscarCaderno(eventoId, cadernoId);
        caderno.marcarPerdido(observacao);
        registrarHistorico(caderno, observacao);

        return CadernoChoroResponse.from(caderno);
    }

    @Transactional
    public CadernoChoroResponse marcarSubstituido(Long eventoId, Long cadernoId, String observacao) {
        var caderno = buscarCaderno(eventoId, cadernoId);
        caderno.marcarSubstituido(observacao);
        registrarHistorico(caderno, observacao);

        return CadernoChoroResponse.from(caderno);
    }

    @Transactional
    public CadernoChoroResponse cancelar(Long eventoId, Long cadernoId, String observacao) {
        var caderno = buscarCaderno(eventoId, cadernoId);
        caderno.cancelar(observacao);
        registrarHistorico(caderno, observacao);

        return CadernoChoroResponse.from(caderno);
    }

    private void registrarHistorico(CadernoChoro caderno, String observacao) {
        historicoRepository.save(new CadernoChoroHistorico(caderno, caderno.getStatus(), observacao));
    }

    private CadernoChoro buscarCaderno(Long eventoId, Long cadernoId) {
        return repository.findByIdAndEventoId(cadernoId, eventoId).orElseThrow(() -> new ResourceNotFoundException("Caderno de Mensagens não encontrado neste evento."));
    }

    private void validarDuplaNoEvento(Long eventoId, Long duplaId) {
        var dupla = duplaRepository.findById(duplaId).orElseThrow(() -> new ResourceNotFoundException("Dupla não encontrada."));

        if (!dupla.getEvento().getId().equals(eventoId)) {
            throw new BusinessException("Dupla não pertence ao evento informado.");
        }
    }
}