package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.Pessoa;
import br.com.paroquia.encontro.dto.request.PessoaRequest;
import br.com.paroquia.encontro.dto.response.PessoaResponse;
import br.com.paroquia.encontro.repository.PessoaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PessoaService {
    private final PessoaRepository repository;

    public PessoaService(PessoaRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<PessoaResponse> listar(String busca) {
        var pessoas = (busca == null || busca.isBlank()) ? repository.findAll() : repository.findByNomeContainingIgnoreCaseOrderByNome(busca);
        return pessoas.stream().map(PessoaResponse::from).toList();
    }

    @Transactional
    public PessoaResponse criar(PessoaRequest request) {
        return PessoaResponse.from(repository.save(new Pessoa(request.nome(), request.telefone(), request.email(), request.dataNascimento(), request.tipo(), request.observacoes())));
    }

    @Transactional
    public PessoaResponse atualizar(Long id, PessoaRequest request) {
        var p = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada."));
        p.atualizar(request.nome(), request.telefone(), request.email(), request.dataNascimento(), request.tipo(), request.observacoes());
        return PessoaResponse.from(p);
    }
}
