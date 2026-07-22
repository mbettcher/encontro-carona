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
    private final CadernoChoroService cadernoChoroService;

    public SobrinhoService(
            SobrinhoRepository repository,
            EventoRepository eventoRepository,
            PessoaRepository pessoaRepository,
            SobrinhoPresencaRepository sobrinhoPresencaRepository,
            CredencialOperacionalService credencialOperacionalService,
            CadernoChoroService cadernoChoroService
    ) {
        this.repository = repository;
        this.eventoRepository = eventoRepository;
        this.pessoaRepository = pessoaRepository;
        this.sobrinhoPresencaRepository = sobrinhoPresencaRepository;
        this.credencialOperacionalService = credencialOperacionalService;
        this.cadernoChoroService = cadernoChoroService;
    }

    @Transactional(readOnly = true)
    public List<SobrinhoResponse> listar(Long eventoId) {
        return repository.findByEventoIdOrderByNome(eventoId)
                .stream()
                .map(sobrinho -> SobrinhoResponse.from(
                        sobrinho,
                        sobrinhoPresencaRepository
                                .findFirstBySobrinhoIdOrderByOcorridoEmDesc(
                                        sobrinho.getId()
                                )
                                .orElse(null)
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SobrinhoPresencaResponse> listarPresencasEvento(
            Long eventoId
    ) {
        return sobrinhoPresencaRepository
                .findByEventoIdOrderByOcorridoEmDesc(eventoId)
                .stream()
                .map(SobrinhoPresencaResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SobrinhoPresencaResponse> listarPresencas(
            Long eventoId,
            Long sobrinhoId
    ) {
        buscarPorIdEvento(eventoId, sobrinhoId);

        return sobrinhoPresencaRepository
                .findBySobrinhoIdOrderByOcorridoEmDesc(sobrinhoId)
                .stream()
                .map(SobrinhoPresencaResponse::from)
                .toList();
    }

    @Transactional
    public SobrinhoResponse criar(
            Long eventoId,
            SobrinhoRequest request
    ) {
        var evento = eventoRepository.findById(eventoId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Evento não encontrado."
                        )
                );

        var nome = normalizarTextoObrigatorio(
                request.nome(),
                "O nome do encontrista é obrigatório."
        );
        var responsavelNome = normalizarTextoObrigatorio(
                request.responsavelNome(),
                "O nome do responsável é obrigatório."
        );
        var responsavelTelefone = normalizarTextoObrigatorio(
                request.responsavelTelefone(),
                "O telefone do responsável é obrigatório."
        );
        var endereco = normalizarTextoObrigatorio(
                request.endereco(),
                "O endereço é obrigatório."
        );
        var dataNascimento = validarDataNascimento(
                request.dataNascimento()
        );

        var sobrinho = new Sobrinho(
                evento,
                nome,
                normalizarTextoOpcional(request.telefone()),
                responsavelNome,
                responsavelTelefone,
                endereco,
                dataNascimento,
                normalizarTextoOpcional(request.restricaoAlimentar()),
                normalizarTextoOpcional(request.observacaoMedica())
        );

        return SobrinhoResponse.from(
                repository.save(sobrinho)
        );
    }

    @Transactional
    public SobrinhoResponse adicionarPessoa(
            Long eventoId,
            AdicionarPessoaSobrinhoRequest request
    ) {
        var evento = eventoRepository.findById(eventoId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Evento não encontrado."
                        )
                );

        var pessoa = pessoaRepository.findById(request.pessoaId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Pessoa não encontrada."
                        )
                );

        validarPessoaEncontrista(pessoa);
        validarPessoaAindaNaoInscritaNoEvento(
                eventoId,
                pessoa.getId()
        );

        /*
         * Completa somente campos ausentes na Pessoa.
         * Valores já cadastrados nunca são sobrescritos.
         */
        pessoa.complementarDadosDoEncontrista(
                normalizarTextoOpcional(request.telefone()),
                request.dataNascimento(),
                normalizarTextoOpcional(request.responsavelNome()),
                normalizarTextoOpcional(request.responsavelTelefone()),
                normalizarTextoOpcional(request.endereco())
        );

        /*
         * Após a complementação, a Pessoa passa a ser a fonte oficial
         * dos campos compartilhados. O Sobrinho recebe um snapshot.
         */
        var telefone = normalizarTextoOpcional(
                pessoa.getTelefone()
        );
        var responsavelNome = normalizarTextoObrigatorio(
                pessoa.getResponsavelNome(),
                "Informe o nome do responsável ou atualize o cadastro da pessoa."
        );
        var responsavelTelefone = normalizarTextoObrigatorio(
                pessoa.getResponsavelTelefone(),
                "Informe o telefone do responsável ou atualize o cadastro da pessoa."
        );
        var endereco = normalizarTextoObrigatorio(
                pessoa.getEndereco(),
                "Informe o endereço ou atualize o cadastro da pessoa."
        );
        var dataNascimento = validarDataNascimento(
                pessoa.getDataNascimento()
        );

        var sobrinho = new Sobrinho(
                evento,
                pessoa,
                pessoa.getNome(),
                telefone,
                responsavelNome,
                responsavelTelefone,
                endereco,
                dataNascimento,
                normalizarTextoOpcional(request.restricaoAlimentar()),
                normalizarTextoOpcional(request.observacaoMedica())
        );

        return SobrinhoResponse.from(
                repository.save(sobrinho)
        );
    }

    @Transactional
    public SobrinhoResponse registrarPresenca(
            Long eventoId,
            Long sobrinhoId,
            OperacaoPresencaSobrinho operacao,
            String observacao
    ) {
        var sobrinho = buscarPorIdEvento(
                eventoId,
                sobrinhoId
        );

        return executarRegistroPresenca(
                sobrinho,
                operacao,
                OrigemPresencaSobrinho.MANUAL,
                observacao
        );
    }

    @Transactional
    public SobrinhoResponse registrarPresencaPorCredencial(
            Long eventoId,
            String codigoIdentificacao,
            OperacaoPresencaSobrinho operacao,
            String observacao
    ) {
        var sobrinho =
                credencialOperacionalService
                        .resolverSobrinhoPorCredencial(
                                eventoId,
                                codigoIdentificacao
                        );

        return executarRegistroPresenca(
                sobrinho,
                operacao,
                OrigemPresencaSobrinho.CREDENCIAL,
                observacao
        );
    }

    private SobrinhoResponse executarRegistroPresenca(
            Sobrinho sobrinho,
            OperacaoPresencaSobrinho operacao,
            OrigemPresencaSobrinho origem,
            String observacao
    ) {
        if (operacao == null) {
            throw new BusinessException(
                    "Operação de presença deve ser informada."
            );
        }

        var statusAnterior = sobrinho.getStatus();

        var novoStatus = switch (operacao) {
            case PRESENTE -> SobrinhoStatus.PRESENTE;

            case AUSENTE -> SobrinhoStatus.AUSENTE;

            case DESISTENTE -> SobrinhoStatus.DESISTENTE;
        };

        var presenca = sobrinhoPresencaRepository.save(
                new SobrinhoPresenca(
                        sobrinho.getEvento(),
                        sobrinho,
                        novoStatus,
                        origem,
                        observacao
                )
        );

        sobrinho.atualizarStatusPresenca(novoStatus);

        integrarCadernoComMudancaParticipacao(
                sobrinho,
                statusAnterior,
                novoStatus,
                observacao
        );

        return SobrinhoResponse.from(
                sobrinho,
                presenca
        );
    }

    private void integrarCadernoComMudancaParticipacao(
            Sobrinho sobrinho,
            SobrinhoStatus statusAnterior,
            SobrinhoStatus novoStatus,
            String observacao
    ) {
        /*
         * Evita duplicar cancelamento ou timeline quando a mesma operação
         * DESISTENTE é registrada novamente.
         */
        if (novoStatus == SobrinhoStatus.DESISTENTE
                && statusAnterior != SobrinhoStatus.DESISTENTE) {
            cadernoChoroService.registrarDesistenciaEncontrista(
                    sobrinho.getEvento().getId(),
                    sobrinho.getId(),
                    observacao
            );

            return;
        }

        /*
         * Qualquer saída do estado DESISTENTE representa retomada da
         * participação. A nova situação poderá ser PRESENTE ou AUSENTE.
         */
        if (statusAnterior == SobrinhoStatus.DESISTENTE
                && novoStatus != SobrinhoStatus.DESISTENTE) {
            cadernoChoroService.registrarRetomadaParticipacao(
                    sobrinho.getEvento().getId(),
                    sobrinho.getId(),
                    observacao
            );
        }
    }

    @Transactional
    public SobrinhoResponse atualizar(
            Long eventoId,
            Long sobrinhoId,
            SobrinhoRequest request
    ) {
        var sobrinho = buscarPorIdEvento(
                eventoId,
                sobrinhoId
        );

        if (sobrinho.getPessoa() == null) {
            atualizarEncontristaExclusivo(
                    sobrinho,
                    request
            );
        } else {
            atualizarEncontristaVinculado(
                    sobrinho,
                    request
            );
        }

        var ultimaPresenca = sobrinhoPresencaRepository
                .findFirstBySobrinhoIdOrderByOcorridoEmDesc(
                        sobrinho.getId()
                )
                .orElse(null);

        return SobrinhoResponse.from(
                sobrinho,
                ultimaPresenca
        );
    }

    private void atualizarEncontristaExclusivo(
            Sobrinho sobrinho,
            SobrinhoRequest request
    ) {
        sobrinho.atualizarDados(
                normalizarTextoObrigatorio(
                        request.nome(),
                        "O nome do encontrista é obrigatório."
                ),
                normalizarTextoOpcional(request.telefone()),
                normalizarTextoObrigatorio(
                        request.responsavelNome(),
                        "O nome do responsável é obrigatório."
                ),
                normalizarTextoObrigatorio(
                        request.responsavelTelefone(),
                        "O telefone do responsável é obrigatório."
                ),
                normalizarTextoObrigatorio(
                        request.endereco(),
                        "O endereço é obrigatório."
                ),
                validarDataNascimento(request.dataNascimento()),
                normalizarTextoOpcional(request.restricaoAlimentar()),
                normalizarTextoOpcional(request.observacaoMedica())
        );
    }

    private void atualizarEncontristaVinculado(
            Sobrinho sobrinho,
            SobrinhoRequest request
    ) {
        var pessoa = sobrinho.getPessoa();

        /*
         * Campos ausentes em Pessoa podem ser informados pelo formulário
         * do Encontrista. Campos existentes permanecem protegidos.
         */
        pessoa.complementarDadosDoEncontrista(
                normalizarTextoOpcional(request.telefone()),
                request.dataNascimento(),
                normalizarTextoOpcional(request.responsavelNome()),
                normalizarTextoOpcional(request.responsavelTelefone()),
                normalizarTextoOpcional(request.endereco())
        );

        /*
         * Nome e demais dados compartilhados são sempre obtidos da Pessoa.
         * Restrição alimentar e observação médica continuam específicas
         * da inscrição no evento.
         */
        sobrinho.atualizarDados(
                pessoa.getNome(),
                normalizarTextoOpcional(pessoa.getTelefone()),
                normalizarTextoObrigatorio(
                        pessoa.getResponsavelNome(),
                        "Informe o nome do responsável ou atualize o cadastro da pessoa."
                ),
                normalizarTextoObrigatorio(
                        pessoa.getResponsavelTelefone(),
                        "Informe o telefone do responsável ou atualize o cadastro da pessoa."
                ),
                normalizarTextoObrigatorio(
                        pessoa.getEndereco(),
                        "Informe o endereço ou atualize o cadastro da pessoa."
                ),
                validarDataNascimento(pessoa.getDataNascimento()),
                normalizarTextoOpcional(request.restricaoAlimentar()),
                normalizarTextoOpcional(request.observacaoMedica())
        );
    }

    private Sobrinho buscarPorIdEvento(
            Long eventoId,
            Long sobrinhoId
    ) {
        return repository.findByIdAndEventoId(
                        sobrinhoId,
                        eventoId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Encontrista não encontrado neste evento."
                        )
                );
    }

    private void validarPessoaEncontrista(Pessoa pessoa) {
        if (!pessoa.isAtivo()) {
            throw new BusinessException(
                    "A pessoa selecionada está inativa e não pode ser " +
                            "adicionada a um novo vínculo. Reative o " +
                            "cadastro antes de continuar."
            );
        }

        if (pessoa.getTipo() != PessoaTipo.SOBRINHO) {
            throw new BusinessException(
                    "Somente pessoas do tipo Encontrista podem ser " +
                            "adicionadas como encontristas do evento."
            );
        }
    }

    private void validarPessoaAindaNaoInscritaNoEvento(
            Long eventoId,
            Long pessoaId
    ) {
        if (repository.existsByEventoIdAndPessoaId(
                eventoId,
                pessoaId
        )) {
            throw new BusinessException(
                    "Esta pessoa já está cadastrada como encontrista " +
                            "neste evento."
            );
        }
    }

    private LocalDate validarDataNascimento(
            LocalDate dataNascimento
    ) {
        if (dataNascimento == null) {
            throw new BusinessException(
                    "Informe a data de nascimento do encontrista ou " +
                            "atualize o cadastro da pessoa."
            );
        }

        return dataNascimento;
    }

    private String normalizarTextoObrigatorio(
            String valor,
            String mensagem
    ) {
        var normalizado = normalizarTextoOpcional(valor);

        if (normalizado == null) {
            throw new BusinessException(mensagem);
        }

        return normalizado;
    }

    private String normalizarTextoOpcional(String valor) {
        if (valor == null) {
            return null;
        }

        var texto = valor.trim();

        return texto.isBlank()
                ? null
                : texto;
    }

}