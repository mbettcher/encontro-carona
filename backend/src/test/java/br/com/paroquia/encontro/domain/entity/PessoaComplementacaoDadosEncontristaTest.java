package br.com.paroquia.encontro.domain.entity;

import br.com.paroquia.encontro.domain.enums.PessoaTipo;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class PessoaComplementacaoDadosEncontristaTest {

    @Test
    void deveComplementarSomenteCamposAusentes() {
        var pessoa = novaPessoa(
                null,
                null,
                null,
                null,
                null
        );

        var nascimento = LocalDate.of(2010, 5, 20);

        var alterou = pessoa.complementarDadosDoEncontrista(
                "  (11) 99999-1111  ",
                nascimento,
                "  Maria da Silva  ",
                "  (11) 98888-2222  ",
                "  Rua das Flores, 100  "
        );

        assertTrue(alterou);
        assertEquals("(11) 99999-1111", pessoa.getTelefone());
        assertEquals(nascimento, pessoa.getDataNascimento());
        assertEquals("Maria da Silva", pessoa.getResponsavelNome());
        assertEquals("(11) 98888-2222", pessoa.getResponsavelTelefone());
        assertEquals("Rua das Flores, 100", pessoa.getEndereco());
    }

    @Test
    void naoDeveSobrescreverCamposJaPreenchidos() {
        var nascimentoOriginal = LocalDate.of(2009, 1, 10);
        var pessoa = novaPessoa(
                "(11) 90000-0000",
                nascimentoOriginal,
                "Responsável original",
                "(11) 91111-1111",
                "Endereço original"
        );

        var alterou = pessoa.complementarDadosDoEncontrista(
                "(22) 92222-2222",
                LocalDate.of(2011, 2, 20),
                "Outro responsável",
                "(22) 93333-3333",
                "Outro endereço"
        );

        assertFalse(alterou);
        assertEquals("(11) 90000-0000", pessoa.getTelefone());
        assertEquals(nascimentoOriginal, pessoa.getDataNascimento());
        assertEquals("Responsável original", pessoa.getResponsavelNome());
        assertEquals("(11) 91111-1111", pessoa.getResponsavelTelefone());
        assertEquals("Endereço original", pessoa.getEndereco());
    }

    @Test
    void deveIgnorarTextosNulosVaziosOuSomenteComEspacos() {
        var pessoa = novaPessoa(
                null,
                null,
                null,
                null,
                null
        );

        var alterou = pessoa.complementarDadosDoEncontrista(
                "   ",
                null,
                "",
                null,
                "\t"
        );

        assertFalse(alterou);
        assertNull(pessoa.getTelefone());
        assertNull(pessoa.getDataNascimento());
        assertNull(pessoa.getResponsavelNome());
        assertNull(pessoa.getResponsavelTelefone());
        assertNull(pessoa.getEndereco());
    }

    @Test
    void deveComplementarParcialmenteSemAlterarCamposExistentes() {
        var pessoa = novaPessoa(
                "(11) 90000-0000",
                null,
                null,
                null,
                "Endereço original"
        );

        var nascimento = LocalDate.of(2012, 8, 15);

        var alterou = pessoa.complementarDadosDoEncontrista(
                "(22) 92222-2222",
                nascimento,
                "Novo responsável",
                "(22) 93333-3333",
                "Outro endereço"
        );

        assertTrue(alterou);
        assertEquals("(11) 90000-0000", pessoa.getTelefone());
        assertEquals(nascimento, pessoa.getDataNascimento());
        assertEquals("Novo responsável", pessoa.getResponsavelNome());
        assertEquals("(22) 93333-3333", pessoa.getResponsavelTelefone());
        assertEquals("Endereço original", pessoa.getEndereco());
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
