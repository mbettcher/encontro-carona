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
    private final EventoRepository eventoRepository;
    private final PessoaRepository pessoaRepository;
    private final CadernoChoroRepository cadernoChoroRepository;

    public EquipeMontagemKitService(
            EquipeMontagemKitRepository repository,
            EventoRepository eventoRepository,
            PessoaRepository pessoaRepository,
            CadernoChoroRepository cadernoChoroRepository
    ) {
        this.repository = repository;
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
        equipe.adicionarIntegrante(buscarPessoaEquipe(request.pessoaId()));

        return EquipeMontagemKitResponse.from(equipe);
    }

    @Transactional
    public EquipeMontagemKitResponse removerIntegrante(Long eventoId, Long equipeId, Long integranteId) {
        var equipe = buscarEquipe(eventoId, equipeId);
        equipe.removerIntegrante(integranteId);

        return EquipeMontagemKitResponse.from(equipe);
    }

    private void adicionarIntegrantesIniciais(EquipeMontagemKit equipe, List<Long> integranteIds) {
        if (integranteIds == null || integranteIds.isEmpty()) {
            return;
        }

        new LinkedHashSet<>(integranteIds).forEach(pessoaId ->
                equipe.adicionarIntegrante(buscarPessoaEquipe(pessoaId))
        );
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
