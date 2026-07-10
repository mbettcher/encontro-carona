package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.Pessoa;
import br.com.paroquia.encontro.domain.entity.Sobrinho;
import br.com.paroquia.encontro.domain.entity.SobrinhoPresenca;
import br.com.paroquia.encontro.domain.enums.OperacaoPresencaSobrinho;
import br.com.paroquia.encontro.domain.enums.OrigemPresencaSobrinho;
import br.com.paroquia.encontro.domain.enums.PessoaTipo;
import br.com.paroquia.encontro.domain.enums.SobrinhoStatus;
import br.com.paroquia.encontro.dto.request.AdicionarPessoaSobrinhoRequest;
import br.com.paroquia.encontro.dto.request.SobrinhoRequest;
import br.com.paroquia.encontro.dto.response.SobrinhoPresencaResponse;
import br.com.paroquia.encontro.dto.response.SobrinhoResponse;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.PessoaRepository;
import br.com.paroquia.encontro.repository.SobrinhoPresencaRepository;
import br.com.paroquia.encontro.repository.SobrinhoRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class SobrinhoService {
    private final SobrinhoRepository repository;
    private final EventoRepository eventoRepository;
    private final PessoaRepository pessoaRepository;
    private final SobrinhoPresencaRepository sobrinhoPresencaRepository;
    private final CredencialOperacionalService credencialOperacionalService;

    public SobrinhoService(
            SobrinhoRepository repository,
            EventoRepository eventoRepository,
            PessoaRepository pessoaRepository,
            SobrinhoPresencaRepository sobrinhoPresencaRepository,
            CredencialOperacionalService credencialOperacionalService
    ) {
        this.repository = repository;
        this.eventoRepository = eventoRepository;
        this.pessoaRepository = pessoaRepository;
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
        var evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));

        return SobrinhoResponse.from(repository.save(new Sobrinho(
                evento,
                request.nome(),
                request.telefone(),
                request.responsavelNome(),
                request.responsavelTelefone(),
                request.endereco(),
                request.dataNascimento(),
                request.restricaoAlimentar(),
                request.observacaoMedica()
        )));
    }

    @Transactional
    public SobrinhoResponse adicionarPessoa(Long eventoId, AdicionarPessoaSobrinhoRequest request) {
        var evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));

        var pessoa = pessoaRepository.findById(request.pessoaId())
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada."));

        validarPessoaEncontrista(pessoa);
        validarPessoaAindaNaoInscritaNoEvento(eventoId, pessoa.getId());

        var dataNascimento = request.dataNascimento() != null
                ? request.dataNascimento()
                : pessoa.getDataNascimento();

        if (dataNascimento == null) {
            throw new BusinessException("Informe a data de nascimento do encontrista ou atualize o cadastro da pessoa.");
        }

        var sobrinho = new Sobrinho(
                evento,
                pessoa,
                pessoa.getNome(),
                textoOuFallback(request.telefone(), pessoa.getTelefone()),
                normalizarTextoObrigatorio(request.responsavelNome()),
                normalizarTextoObrigatorio(request.responsavelTelefone()),
                normalizarTextoObrigatorio(request.endereco()),
                dataNascimento,
                normalizarTextoOpcional(request.restricaoAlimentar()),
                normalizarTextoOpcional(request.observacaoMedica())
        );

        return SobrinhoResponse.from(repository.save(sobrinho));
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

    @Transactional
    public SobrinhoResponse atualizar(
            Long eventoId,
            Long sobrinhoId,
            SobrinhoRequest request
    ) {
        var sobrinho = buscarPorIdEvento(eventoId, sobrinhoId);

        sobrinho.atualizarDados(
                request.nome(),
                request.telefone(),
                request.responsavelNome(),
                request.responsavelTelefone(),
                request.endereco(),
                request.dataNascimento(),
                request.restricaoAlimentar(),
                request.observacaoMedica()
        );

        var ultimaPresenca = sobrinhoPresencaRepository
                .findFirstBySobrinhoIdOrderByOcorridoEmDesc(sobrinho.getId())
                .orElse(null);

        return SobrinhoResponse.from(sobrinho, ultimaPresenca);
    }

    private Sobrinho buscarPorIdEvento(Long eventoId, Long sobrinhoId) {
        return repository.findByIdAndEventoId(sobrinhoId, eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Encontrista não encontrado neste evento."));
    }

    private void validarPessoaEncontrista(Pessoa pessoa) {
        if (pessoa.getTipo() != PessoaTipo.SOBRINHO) {
            throw new BusinessException("Somente pessoas do tipo Encontrista podem ser adicionadas como encontristas do evento.");
        }
    }

    private void validarPessoaAindaNaoInscritaNoEvento(Long eventoId, Long pessoaId) {
        if (repository.existsByEventoIdAndPessoaId(eventoId, pessoaId)) {
            throw new BusinessException("Esta pessoa já está cadastrada como encontrista neste evento.");
        }
    }

    private String textoOuFallback(String valor, String fallback) {
        var normalizado = normalizarTextoOpcional(valor);

        if (normalizado != null) {
            return normalizado;
        }

        return normalizarTextoOpcional(fallback);
    }

    private String normalizarTextoObrigatorio(String valor) {
        return valor == null ? null : valor.trim();
    }

    private String normalizarTextoOpcional(String valor) {
        if (valor == null) {
            return null;
        }

        var texto = valor.trim();
        return texto.isBlank() ? null : texto;
    }
}
