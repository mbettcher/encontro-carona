package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.Paroquia;
import br.com.paroquia.encontro.dto.request.ParoquiaRequest;
import br.com.paroquia.encontro.dto.response.ParoquiaResponse;
import br.com.paroquia.encontro.repository.DuplaTioCaronaRepository;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.ParoquiaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ParoquiaService {
    private final ParoquiaRepository repository;
    private final EventoRepository eventoRepository;
    private final DuplaTioCaronaRepository duplaRepository;

    public ParoquiaService(
            ParoquiaRepository repository,
            EventoRepository eventoRepository,
            DuplaTioCaronaRepository duplaRepository
    ) {
        this.repository = repository;
        this.eventoRepository = eventoRepository;
        this.duplaRepository = duplaRepository;
    }

    @Transactional(readOnly = true)
    public List<ParoquiaResponse> listar() {
        return repository.findAll().stream().map(ParoquiaResponse::from).toList();
    }

    @Transactional
    public ParoquiaResponse criar(ParoquiaRequest request) {
        var paroquia = new Paroquia(request.nome(), request.endereco(), request.cidade(), request.uf(), request.telefone(), request.email(), request.responsavel());
        return ParoquiaResponse.from(repository.save(paroquia));
    }

    @Transactional
    public ParoquiaResponse atualizar(Long id, ParoquiaRequest request) {
        var paroquia = buscar(id);
        paroquia.atualizar(request.nome(), request.endereco(), request.cidade(), request.uf(), request.telefone(), request.email(), request.responsavel());
        return ParoquiaResponse.from(paroquia);
    }

    @Transactional
    public ParoquiaResponse inativar(Long id) {
        var paroquia = buscar(id);
        paroquia.inativar();
        return ParoquiaResponse.from(paroquia);
    }

    @Transactional
    public ParoquiaResponse reativar(Long id) {
        var paroquia = buscar(id);
        paroquia.reativar();
        return ParoquiaResponse.from(paroquia);
    }

    @Transactional
    public void excluir(Long id) {
        var paroquia = buscar(id);
        validarExclusao(paroquia);
        repository.delete(paroquia);
    }

    private Paroquia buscar(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paróquia/Comunidade não encontrada."));
    }

    private void validarExclusao(Paroquia paroquia) {
        if (eventoRepository.countByParoquiaId(paroquia.getId()) > 0) {
            throw new BusinessException("Não é possível excluir esta paróquia/comunidade porque ela está vinculada a evento(s). Inative o cadastro.");
        }

        if (duplaRepository.countByParoquiaComunidadeId(paroquia.getId()) > 0) {
            throw new BusinessException("Não é possível excluir esta paróquia/comunidade porque ela está vinculada a dupla(s). Inative o cadastro.");
        }
    }
}
