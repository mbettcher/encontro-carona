package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.Paroquia;
import br.com.paroquia.encontro.dto.request.ParoquiaRequest;
import br.com.paroquia.encontro.dto.response.ParoquiaResponse;
import br.com.paroquia.encontro.repository.ParoquiaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ParoquiaService {
    private final ParoquiaRepository repository;

    public ParoquiaService(ParoquiaRepository repository) {
        this.repository = repository;
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
        var paroquia = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Paróquia não encontrada."));
        paroquia.atualizar(request.nome(), request.endereco(), request.cidade(), request.uf(), request.telefone(), request.email(), request.responsavel());
        return ParoquiaResponse.from(paroquia);
    }
}
