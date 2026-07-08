package br.com.paroquia.encontro.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.OffsetDateTime;

@Entity
@Table(name = "paroquia")
public class Paroquia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 150)
    private String nome;

    @Column(length = 180)
    private String endereco;

    @Column(length = 80)
    private String cidade;

    @Column(length = 2)
    private String uf;

    @Column(length = 30)
    private String telefone;

    @Column(length = 120)
    private String email;

    @Column(length = 120)
    private String responsavel;

    @Column(nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    protected Paroquia() {
    }

    public Paroquia(String nome, String endereco, String cidade, String uf, String telefone, String email, String responsavel) {
        this.nome = nome;
        this.endereco = endereco;
        this.cidade = cidade;
        this.uf = uf;
        this.telefone = telefone;
        this.email = email;
        this.responsavel = responsavel;
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getEndereco() {
        return endereco;
    }

    public String getCidade() {
        return cidade;
    }

    public String getUf() {
        return uf;
    }

    public String getTelefone() {
        return telefone;
    }

    public String getEmail() {
        return email;
    }

    public String getResponsavel() {
        return responsavel;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }

    public void atualizar(String nome, String endereco, String cidade, String uf, String telefone, String email, String responsavel) {
        this.nome = nome;
        this.endereco = endereco;
        this.cidade = cidade;
        this.uf = uf;
        this.telefone = telefone;
        this.email = email;
        this.responsavel = responsavel;
    }
}
