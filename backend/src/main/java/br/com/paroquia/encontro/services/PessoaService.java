package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.Pessoa;
import br.com.paroquia.encontro.dto.request.PessoaRequest;
import br.com.paroquia.encontro.dto.response.PessoaResponse;
import br.com.paroquia.encontro.repository.EquipeMontagemKitIntegranteRepository;
import br.com.paroquia.encontro.repository.PessoaRepository;
import br.com.paroquia.encontro.repository.SobrinhoRepository;
import br.com.paroquia.encontro.repository.TioCaronaEventoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PessoaService {
    private final PessoaRepository repository;
    private final TioCaronaEventoRepository tioCaronaRepository;
    private final SobrinhoRepository sobrinhoRepository;
    private final EquipeMontagemKitIntegranteRepository equipeIntegranteRepository;

    public PessoaService(
            PessoaRepository repository,
            TioCaronaEventoRepository tioCaronaRepository,
            SobrinhoRepository sobrinhoRepository,
            EquipeMontagemKitIntegranteRepository equipeIntegranteRepository
    ) {
        this.repository = repository;
        this.tioCaronaRepository = tioCaronaRepository;
        this.sobrinhoRepository = sobrinhoRepository;
        this.equipeIntegranteRepository = equipeIntegranteRepository;
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
        var p = buscar(id);
        p.atualizar(request.nome(), request.telefone(), request.email(), request.dataNascimento(), request.tipo(), request.observacoes());
        return PessoaResponse.from(p);
    }

    @Transactional
    public PessoaResponse inativar(Long id) {
        var pessoa = buscar(id);
        pessoa.inativar();
        return PessoaResponse.from(pessoa);
    }

    @Transactional
    public PessoaResponse reativar(Long id) {
        var pessoa = buscar(id);
        pessoa.reativar();
        return PessoaResponse.from(pessoa);
    }

    @Transactional
    public void excluir(Long id) {
        var pessoa = buscar(id);
        validarExclusao(pessoa);
        repository.delete(pessoa);
    }

    private Pessoa buscar(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada."));
    }

    private void validarExclusao(Pessoa pessoa) {
        if (tioCaronaRepository.countByPessoaId(pessoa.getId()) > 0) {
            throw new BusinessException("Não é possível excluir esta pessoa porque ela está vinculada como tio carona em evento(s). Inative o cadastro.");
        }

        if (sobrinhoRepository.countByPessoaId(pessoa.getId()) > 0) {
            throw new BusinessException("Não é possível excluir esta pessoa porque ela está vinculada como encontrista em evento(s). Inative o cadastro.");
        }

        if (equipeIntegranteRepository.countByPessoaId(pessoa.getId()) > 0) {
            throw new BusinessException("Não é possível excluir esta pessoa porque ela está vinculada a equipe(s) do kit. Inative o cadastro.");
        }
    }
}
