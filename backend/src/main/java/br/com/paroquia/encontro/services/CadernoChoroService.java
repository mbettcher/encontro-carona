package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.CadernoChoro;
import br.com.paroquia.encontro.domain.entity.CadernoChoroHistorico;
import br.com.paroquia.encontro.domain.entity.EquipeMontagemKit;
import br.com.paroquia.encontro.domain.enums.StatusCadernoChoro;
import br.com.paroquia.encontro.domain.enums.StatusEquipeMontagemKit;
import br.com.paroquia.encontro.domain.enums.VinculoStatus;
import br.com.paroquia.encontro.dto.response.CadernoChoroGeracaoResponse;
import br.com.paroquia.encontro.dto.response.CadernoChoroHistoricoResponse;
import br.com.paroquia.encontro.dto.response.CadernoChoroResponse;
import br.com.paroquia.encontro.repository.CadernoChoroHistoricoRepository;
import br.com.paroquia.encontro.repository.CadernoChoroRepository;
import br.com.paroquia.encontro.repository.DuplaTioCaronaRepository;
import br.com.paroquia.encontro.repository.EquipeMontagemKitRepository;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.SobrinhoDuplaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CadernoChoroService {
    private static final List<StatusCadernoChoro> STATUS_NAO_CONTAM_CARGA_EQUIPE = List.of(
            StatusCadernoChoro.ENTREGUE_AO_SOBRINHO,
            StatusCadernoChoro.PERDIDO,
            StatusCadernoChoro.SUBSTITUIDO,
            StatusCadernoChoro.CANCELADO
    );

    private final CadernoChoroRepository repository;
    private final CadernoChoroHistoricoRepository historicoRepository;
    private final EventoRepository eventoRepository;
    private final DuplaTioCaronaRepository duplaRepository;
    private final SobrinhoDuplaRepository sobrinhoDuplaRepository;
    private final EquipeMontagemKitRepository equipeMontagemKitRepository;

    public CadernoChoroService(
            CadernoChoroRepository repository,
            CadernoChoroHistoricoRepository historicoRepository,
            EventoRepository eventoRepository,
            DuplaTioCaronaRepository duplaRepository,
            SobrinhoDuplaRepository sobrinhoDuplaRepository,
            EquipeMontagemKitRepository equipeMontagemKitRepository
    ) {
        this.repository = repository;
        this.historicoRepository = historicoRepository;
        this.eventoRepository = eventoRepository;
        this.duplaRepository = duplaRepository;
        this.sobrinhoDuplaRepository = sobrinhoDuplaRepository;
        this.equipeMontagemKitRepository = equipeMontagemKitRepository;
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

        var equipes = equipeMontagemKitRepository.findByEventoIdAndStatusOrderByIdAsc(eventoId, StatusEquipeMontagemKit.ATIVA);

        if (equipes.isEmpty()) {
            throw new BusinessException("Cadastre ao menos uma equipe de montagem do kit ativa antes de receber Cadernos de Mensagens da dupla.");
        }

        var cargasPorEquipe = carregarCargasAtuais(equipes);

        cadernos.forEach(caderno -> {
            caderno.receberDaDupla(observacao);
            registrarHistorico(caderno, observacao);

            var equipe = selecionarEquipeMenosCarregada(equipes, cargasPorEquipe);
            caderno.direcionarEquipeMontagem(equipe, observacao);
            registrarHistorico(caderno, observacaoEquipe(equipe, observacao));

            cargasPorEquipe.compute(equipe.getId(), (id, cargaAtual) -> cargaAtual == null ? 1L : cargaAtual + 1L);
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

    private Map<Long, Long> carregarCargasAtuais(List<EquipeMontagemKit> equipes) {
        var cargasPorEquipe = new HashMap<Long, Long>();

        for (var equipe : equipes) {
            cargasPorEquipe.put(
                    equipe.getId(),
                    repository.countByEquipeMontagemKitIdAndStatusNotIn(
                            equipe.getId(),
                            STATUS_NAO_CONTAM_CARGA_EQUIPE
                    )
            );
        }

        return cargasPorEquipe;
    }

    private EquipeMontagemKit selecionarEquipeMenosCarregada(
            List<EquipeMontagemKit> equipes,
            Map<Long, Long> cargasPorEquipe
    ) {
        return equipes.stream()
                .min((equipe1, equipe2) -> {
                    var carga1 = cargasPorEquipe.getOrDefault(equipe1.getId(), 0L);
                    var carga2 = cargasPorEquipe.getOrDefault(equipe2.getId(), 0L);

                    var comparacaoCarga = Long.compare(carga1, carga2);

                    if (comparacaoCarga != 0) {
                        return comparacaoCarga;
                    }

                    return Long.compare(equipe1.getId(), equipe2.getId());
                })
                .orElseThrow(() -> new BusinessException("Nenhuma equipe de montagem do kit ativa encontrada."));
    }

    private String observacaoEquipe(EquipeMontagemKit equipe, String observacao) {
        var mensagem = "Caderno de Mensagens direcionado automaticamente para a equipe de montagem do kit: " + equipe.getApelido() + ".";

        if (observacao == null || observacao.isBlank()) {
            return mensagem;
        }

        return mensagem + " Observação: " + observacao.trim();
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
