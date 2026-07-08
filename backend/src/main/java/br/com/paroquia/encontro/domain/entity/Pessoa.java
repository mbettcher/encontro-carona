package br.com.paroquia.encontro.domain.entity;

import br.com.paroquia.encontro.domain.enums.PessoaTipo;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "pessoa")
public class Pessoa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank
    @Column(nullable = false, length = 150)
    private String nome;
    @Column(length = 30)
    private String telefone;
    @Column(length = 120)
    private String email;
    @Column(name = "data_nascimento")
    private LocalDate dataNascimento;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PessoaTipo tipo;
    @Column(length = 500)
    private String observacoes;
    @Column(nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    protected Pessoa() {
    }

    public Pessoa(String nome, String telefone, String email, LocalDate dataNascimento, PessoaTipo tipo, String observacoes) {
        this.nome = nome;
        this.telefone = telefone;
        this.email = email;
        this.dataNascimento = dataNascimento;
        this.tipo = tipo;
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

    public String getObservacoes() {
        return observacoes;
    }

    public void atualizar(String nome, String telefone, String email, LocalDate dataNascimento, PessoaTipo tipo, String observacoes) {
        this.nome = nome;
        this.telefone = telefone;
        this.email = email;
        this.dataNascimento = dataNascimento;
        this.tipo = tipo;
        this.observacoes = observacoes;
    }
}
