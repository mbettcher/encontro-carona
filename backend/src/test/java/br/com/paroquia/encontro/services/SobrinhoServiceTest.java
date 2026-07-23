package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.domain.entity.Evento;
import br.com.paroquia.encontro.domain.entity.Pessoa;
import br.com.paroquia.encontro.domain.entity.Sobrinho;
import br.com.paroquia.encontro.domain.enums.PessoaTipo;
import br.com.paroquia.encontro.dto.request.AdicionarPessoaSobrinhoRequest;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.PessoaRepository;
import br.com.paroquia.encontro.repository.SobrinhoPresencaRepository;
import br.com.paroquia.encontro.repository.SobrinhoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SobrinhoServiceTest {

    @Mock
    private SobrinhoRepository repository;

    @Mock
    private EventoRepository eventoRepository;

    @Mock
    private PessoaRepository pessoaRepository;

    @Mock
    private SobrinhoPresencaRepository sobrinhoPresencaRepository;

    @Mock
    private CredencialOperacionalService credencialOperacionalService;

    @Mock
    private CadernoChoroService cadernoChoroService;

    private SobrinhoService service;

    @BeforeEach
    void setUp() {
        service = new SobrinhoService(
                repository,
                eventoRepository,
                pessoaRepository,
                sobrinhoPresencaRepository,
                credencialOperacionalService,
                cadernoChoroService
        );

        when(repository.save(any(Sobrinho.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void deveCriarSnapshotComDadosDaPessoaAposComplementacao() {
        var evento = mock(Evento.class);
        var pessoa = novaPessoa(
                null,
                null,
                null,
                null,
                null
        );

        when(eventoRepository.findById(1L))
                .thenReturn(Optional.of(evento));
        when(pessoaRepository.findById(10L))
                .thenReturn(Optional.of(pessoa));
        when(repository.existsByEventoIdAndPessoaId(1L, 10L))
                .thenReturn(false);

        var nascimento = LocalDate.of(2010, 6, 12);
        var request = new AdicionarPessoaSobrinhoRequest(
                10L,
                "  (11) 99999-0000  ",
                "  Responsável Teste  ",
                "  (11) 98888-0000  ",
                "  Rua Teste, 100  ",
                nascimento,
                "  Sem lactose  ",
                "  Observação médica  "
        );

        service.adicionarPessoa(1L, request);

        var captor = ArgumentCaptor.forClass(Sobrinho.class);
        verify(repository).save(captor.capture());

        var snapshot = captor.getValue();

        assertSame(pessoa, snapshot.getPessoa());
        assertEquals("Encontrista Teste", snapshot.getNome());
        assertEquals("(11) 99999-0000", snapshot.getTelefone());
        assertEquals("Responsável Teste", snapshot.getResponsavelNome());
        assertEquals("(11) 98888-0000", snapshot.getResponsavelTelefone());
        assertEquals("Rua Teste, 100", snapshot.getEndereco());
        assertEquals(nascimento, snapshot.getDataNascimento());
        assertEquals("Sem lactose", snapshot.getRestricaoAlimentar());
        assertEquals("Observação médica", snapshot.getObservacaoMedica());
    }

    @Test
    void deveRecusarPessoaJaInscritaNoEvento() {
        var evento = mock(Evento.class);
        var pessoa = novaPessoa(
                "(11) 90000-0000",
                LocalDate.of(2010, 1, 1),
                "Responsável",
                "(11) 91111-1111",
                "Endereço"
        );

        when(eventoRepository.findById(1L))
                .thenReturn(Optional.of(evento));
        when(pessoaRepository.findById(10L))
                .thenReturn(Optional.of(pessoa));
        when(repository.existsByEventoIdAndPessoaId(1L, 10L))
                .thenReturn(true);

        var request = new AdicionarPessoaSobrinhoRequest(
                10L,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        var exception = assertThrows(
                BusinessException.class,
                () -> service.adicionarPessoa(1L, request)
        );

        assertEquals(
                "Esta pessoa já está cadastrada como encontrista neste evento.",
                exception.getMessage()
        );
        verify(repository, never()).save(any());
    }

    @Test
    void deveRecusarDataExistenteNaPessoaQueNaoEstejaNoPassado() {
        var evento = mock(Evento.class);
        var pessoa = novaPessoa(
                "(11) 90000-0000",
                LocalDate.now(),
                "Responsável",
                "(11) 91111-1111",
                "Endereço"
        );

        when(eventoRepository.findById(1L))
                .thenReturn(Optional.of(evento));
        when(pessoaRepository.findById(10L))
                .thenReturn(Optional.of(pessoa));
        when(repository.existsByEventoIdAndPessoaId(1L, 10L))
                .thenReturn(false);

        var request = new AdicionarPessoaSobrinhoRequest(
                10L,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        var exception = assertThrows(
                BusinessException.class,
                () -> service.adicionarPessoa(1L, request)
        );

        assertEquals(
                "A data de nascimento deve ser uma data no passado.",
                exception.getMessage()
        );
        verify(repository, never()).save(any());
    }

    private Pessoa novaPessoa(
            String telefone,
            LocalDate dataNascimento,
            String responsavelNome,
            String responsavelTelefone,
            String endereco
    ) {
        return new Pessoa(
                "Encontrista Teste",
                telefone,
                null,
                dataNascimento,
                PessoaTipo.SOBRINHO,
                responsavelNome,
                responsavelTelefone,
                endereco,
                null
        );
    }
}
