package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.EquipeMontagemKit;
import br.com.paroquia.encontro.domain.enums.PessoaTipo;
import br.com.paroquia.encontro.dto.request.EquipeMontagemKitIntegranteRequest;
import br.com.paroquia.encontro.dto.request.EquipeMontagemKitRequest;
import br.com.paroquia.encontro.dto.response.CadernoChoroResponse;
import br.com.paroquia.encontro.dto.response.EquipeMontagemKitResponse;
import br.com.paroquia.encontro.repository.CadernoChoroRepository;
import br.com.paroquia.encontro.repository.EquipeMontagemKitIntegranteRepository;
import br.com.paroquia.encontro.repository.EquipeMontagemKitRepository;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.PessoaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;

@Service
public class EquipeMontagemKitService {
    private final EquipeMontagemKitRepository repository;
    private final EquipeMontagemKitIntegranteRepository integranteRepository;
    private final EventoRepository eventoRepository;
    private final PessoaRepository pessoaRepository;
    private final CadernoChoroRepository cadernoChoroRepository;

    public EquipeMontagemKitService(
            EquipeMontagemKitRepository repository,
            EquipeMontagemKitIntegranteRepository integranteRepository,
            EventoRepository eventoRepository,
            PessoaRepository pessoaRepository,
            CadernoChoroRepository cadernoChoroRepository
    ) {
        this.repository = repository;
        this.integranteRepository = integranteRepository;
        this.eventoRepository = eventoRepository;
        this.pessoaRepository = pessoaRepository;
        this.cadernoChoroRepository = cadernoChoroRepository;
    }

    @Transactional(readOnly = true)
    public List<EquipeMontagemKitResponse> listar(Long eventoId) {
        return repository.findByEventoIdOrderByApelidoAsc(eventoId)
                .stream()
                .map(EquipeMontagemKitResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CadernoChoroResponse> listarCadernos(Long eventoId, Long equipeId) {
        buscarEquipe(eventoId, equipeId);

        return cadernoChoroRepository
                .findByEventoIdAndEquipeMontagemKitIdOrderBySobrinhoNomeAsc(eventoId, equipeId)
                .stream()
                .map(CadernoChoroResponse::from)
                .toList();
    }

    @Transactional
    public EquipeMontagemKitResponse criar(Long eventoId, EquipeMontagemKitRequest request) {
        var evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));

        var apelido = normalizarObrigatorio(request.apelido());

        if (repository.existsByEventoIdAndApelidoIgnoreCase(eventoId, apelido)) {
            throw new BusinessException("Já existe uma equipe de montagem do kit com este apelido no evento.");
        }

        validarIntegrantesDisponiveisNoEvento(eventoId, request.integranteIds(), null);

        var equipe = new EquipeMontagemKit(evento, apelido, request.corIdentificacao());
        adicionarIntegrantesIniciais(equipe, request.integranteIds());

        return EquipeMontagemKitResponse.from(repository.save(equipe));
    }

    @Transactional
    public EquipeMontagemKitResponse atualizar(Long eventoId, Long equipeId, EquipeMontagemKitRequest request) {
        var equipe = buscarEquipe(eventoId, equipeId);
        var apelido = normalizarObrigatorio(request.apelido());

        if (repository.existsByEventoIdAndApelidoIgnoreCaseAndIdNot(eventoId, apelido, equipeId)) {
            throw new BusinessException("Já existe uma equipe de montagem do kit com este apelido no evento.");
        }

        equipe.atualizar(apelido, request.corIdentificacao());
        sincronizarIntegrantes(equipe, request.integranteIds(), eventoId, equipeId);

        return EquipeMontagemKitResponse.from(equipe);
    }

    @Transactional
    public EquipeMontagemKitResponse inativar(Long eventoId, Long equipeId) {
        var equipe = buscarEquipe(eventoId, equipeId);
        equipe.inativar();

        return EquipeMontagemKitResponse.from(equipe);
    }

    @Transactional
    public EquipeMontagemKitResponse reativar(Long eventoId, Long equipeId) {
        var equipe = buscarEquipe(eventoId, equipeId);
        equipe.reativar();

        return EquipeMontagemKitResponse.from(equipe);
    }

    @Transactional
    public EquipeMontagemKitResponse adicionarIntegrante(
            Long eventoId,
            Long equipeId,
            EquipeMontagemKitIntegranteRequest request
    ) {
        var equipe = buscarEquipe(eventoId, equipeId);
        validarIntegranteDisponivelNoEvento(eventoId, request.pessoaId(), equipeId);
        equipe.adicionarIntegrante(buscarPessoaEquipe(request.pessoaId()));

        return EquipeMontagemKitResponse.from(equipe);
    }

    @Transactional
    public EquipeMontagemKitResponse removerIntegrante(Long eventoId, Long equipeId, Long integranteId) {
        var equipe = buscarEquipe(eventoId, equipeId);
        equipe.removerIntegrante(integranteId);

        return EquipeMontagemKitResponse.from(equipe);
    }


    private void sincronizarIntegrantes(
            EquipeMontagemKit equipe,
            List<Long> integranteIds,
            Long eventoId,
            Long equipeId
    ) {
        var idsDesejados = new LinkedHashSet<>(integranteIds == null ? List.<Long>of() : integranteIds);
        validarIntegrantesDisponiveisNoEvento(eventoId, idsDesejados.stream().toList(), equipeId);

        var idsAtuais = equipe.getIntegrantes().stream()
                .map(integrante -> integrante.getPessoa().getId())
                .collect(java.util.stream.Collectors.toSet());

        equipe.getIntegrantes().stream()
                .filter(integrante -> !idsDesejados.contains(integrante.getPessoa().getId()))
                .map(br.com.paroquia.encontro.domain.entity.EquipeMontagemKitIntegrante::getId)
                .toList()
                .forEach(equipe::removerIntegrante);

        idsDesejados.stream()
                .filter(pessoaId -> !idsAtuais.contains(pessoaId))
                .forEach(pessoaId -> equipe.adicionarIntegrante(buscarPessoaEquipe(pessoaId)));
    }

    private void adicionarIntegrantesIniciais(EquipeMontagemKit equipe, List<Long> integranteIds) {
        if (integranteIds == null || integranteIds.isEmpty()) {
            return;
        }

        new LinkedHashSet<>(integranteIds).forEach(pessoaId ->
                equipe.adicionarIntegrante(buscarPessoaEquipe(pessoaId))
        );
    }


    private void validarIntegrantesDisponiveisNoEvento(Long eventoId, List<Long> pessoaIds, Long equipeIdIgnorada) {
        if (pessoaIds == null || pessoaIds.isEmpty()) {
            return;
        }

        new LinkedHashSet<>(pessoaIds).forEach(pessoaId ->
                validarIntegranteDisponivelNoEvento(eventoId, pessoaId, equipeIdIgnorada)
        );
    }

    private void validarIntegranteDisponivelNoEvento(Long eventoId, Long pessoaId, Long equipeIdIgnorada) {
        var pessoa = buscarPessoaEquipe(pessoaId);

        var jaEstaEmOutraEquipe = equipeIdIgnorada == null
                ? integranteRepository.existsByEquipe_Evento_IdAndPessoa_Id(eventoId, pessoa.getId())
                : integranteRepository.existsByEquipe_Evento_IdAndPessoa_IdAndEquipe_IdNot(eventoId, pessoa.getId(), equipeIdIgnorada);

        if (jaEstaEmOutraEquipe) {
            throw new BusinessException("Esta pessoa já participa de outra equipe de montagem do kit neste evento.");
        }
    }

    private br.com.paroquia.encontro.domain.entity.Pessoa buscarPessoaEquipe(Long pessoaId) {
        var pessoa = pessoaRepository.findById(pessoaId)
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa integrante não encontrada."));

        if (pessoa.getTipo() != PessoaTipo.EQUIPE) {
            throw new BusinessException("Somente pessoas cadastradas com o tipo EQUIPE podem integrar equipes de montagem do kit.");
        }

        return pessoa;
    }

    private EquipeMontagemKit buscarEquipe(Long eventoId, Long equipeId) {
        return repository.findByIdAndEventoId(equipeId, eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipe de montagem do kit não encontrada neste evento."));
    }

    private String normalizarObrigatorio(String valor) {
        if (valor == null || valor.isBlank()) {
            throw new BusinessException("O apelido da equipe deve ser informado.");
        }

        return valor.trim();
    }
}
