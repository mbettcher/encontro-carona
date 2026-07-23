package br.com.paroquia.encontro.domain.entity;

import br.com.paroquia.encontro.domain.enums.PessoaTipo;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@Entity
@Table(name = "pessoa")
public class Pessoa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 150)
    private String nome;

    @Size(max = 30)
    @Column(length = 30)
    private String telefone;

    @Size(max = 120)
    @Column(length = 120)
    private String email;

    @Column(name = "data_nascimento")
    private LocalDate dataNascimento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PessoaTipo tipo;

    @Size(max = 150)
    @Column(name = "responsavel_nome", length = 150)
    private String responsavelNome;

    @Size(max = 30)
    @Column(name = "responsavel_telefone", length = 30)
    private String responsavelTelefone;

    @Size(max = 180)
    @Column(length = 180)
    private String endereco;

    @Size(max = 500)
    @Column(length = 500)
    private String observacoes;

    @Column(nullable = false)
    private boolean ativo = true;

    @Column(nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now(ZoneId.systemDefault());

    protected Pessoa() {
    }

    /**
     * Construtor mantido para compatibilidade com os fluxos atuais.
     * <p>
     * Os novos dados de responsável e endereço serão integrados aos
     * contratos no bloco 1.2.1B.
     */
    public Pessoa(
            String nome,
            String telefone,
            String email,
            LocalDate dataNascimento,
            PessoaTipo tipo,
            String observacoes
    ) {
        this(
                nome,
                telefone,
                email,
                dataNascimento,
                tipo,
                null,
                null,
                null,
                observacoes
        );
    }

    public Pessoa(
            String nome,
            String telefone,
            String email,
            LocalDate dataNascimento,
            PessoaTipo tipo,
            String responsavelNome,
            String responsavelTelefone,
            String endereco,
            String observacoes
    ) {
        this.nome = nome;
        this.telefone = telefone;
        this.email = email;
        this.dataNascimento = dataNascimento;
        this.tipo = tipo;
        this.responsavelNome = responsavelNome;
        this.responsavelTelefone = responsavelTelefone;
        this.endereco = endereco;
        this.observacoes = observacoes;
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getTelefone() {
        return telefone;
    }

    public String getEmail() {
        return email;
    }

    public LocalDate getDataNascimento() {
        return dataNascimento;
    }

    public PessoaTipo getTipo() {
        return tipo;
    }

    public String getResponsavelNome() {
        return responsavelNome;
    }

    public String getResponsavelTelefone() {
        return responsavelTelefone;
    }

    public String getEndereco() {
        return endereco;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }

    public void inativar() {
        this.ativo = false;
    }

    public void reativar() {
        this.ativo = true;
    }

    /**
     * Atualização mantida para compatibilidade com o contrato atual.
     */
    public void atualizar(
            String nome,
            String telefone,
            String email,
            LocalDate dataNascimento,
            PessoaTipo tipo,
            String observacoes
    ) {
        atualizar(
                nome,
                telefone,
                email,
                dataNascimento,
                tipo,
                this.responsavelNome,
                this.responsavelTelefone,
                this.endereco,
                observacoes
        );
    }

    public void atualizar(
            String nome,
            String telefone,
            String email,
            LocalDate dataNascimento,
            PessoaTipo tipo,
            String responsavelNome,
            String responsavelTelefone,
            String endereco,
            String observacoes
    ) {
        this.nome = nome;
        this.telefone = telefone;
        this.email = email;
        this.dataNascimento = dataNascimento;
        this.tipo = tipo;
        this.responsavelNome = responsavelNome;
        this.responsavelTelefone = responsavelTelefone;
        this.endereco = endereco;
        this.observacoes = observacoes;
    }

    /**
     * Complementa somente dados ainda ausentes na Pessoa.
     * <p>
     * Esta operação será utilizada pelo cadastro de encontrista vinculado.
     * Nenhum dado já existente é sobrescrito.
     *
     * @return true quando ao menos um campo da Pessoa foi preenchido.
     */
    public boolean complementarDadosDoEncontrista(
            String telefone,
            LocalDate dataNascimento,
            String responsavelNome,
            String responsavelTelefone,
            String endereco
    ) {
        var telefoneNormalizado = normalizarTextoOpcional(telefone);
        var responsavelNomeNormalizado =
                normalizarTextoOpcional(responsavelNome);
        var responsavelTelefoneNormalizado =
                normalizarTextoOpcional(responsavelTelefone);
        var enderecoNormalizado = normalizarTextoOpcional(endereco);

        boolean alterou = false;

        if (semTexto(this.telefone) && telefoneNormalizado != null) {
            this.telefone = telefoneNormalizado;
            alterou = true;
        }

        if (this.dataNascimento == null && dataNascimento != null) {
            this.dataNascimento = dataNascimento;
            alterou = true;
        }

        if (semTexto(this.responsavelNome)
                && responsavelNomeNormalizado != null) {
            this.responsavelNome = responsavelNomeNormalizado;
            alterou = true;
        }

        if (semTexto(this.responsavelTelefone)
                && responsavelTelefoneNormalizado != null) {
            this.responsavelTelefone = responsavelTelefoneNormalizado;
            alterou = true;
        }

        if (semTexto(this.endereco) && enderecoNormalizado != null) {
            this.endereco = enderecoNormalizado;
            alterou = true;
        }

        return alterou;
    }

    public boolean possuiResponsavelNome() {
        return possuiTexto(responsavelNome);
    }

    public boolean possuiResponsavelTelefone() {
        return possuiTexto(responsavelTelefone);
    }

    public boolean possuiEndereco() {
        return possuiTexto(endereco);
    }

    private String normalizarTextoOpcional(String valor) {
        if (valor == null) {
            return null;
        }

        var normalizado = valor.trim();

        return normalizado.isBlank()
                ? null
                : normalizado;
    }

    private boolean possuiTexto(String valor) {
        return normalizarTextoOpcional(valor) != null;
    }

    private boolean semTexto(String valor) {
        return !possuiTexto(valor);
    }
}
