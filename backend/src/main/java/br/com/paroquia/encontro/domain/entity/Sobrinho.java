package br.com.paroquia.encontro.domain.entity;

import br.com.paroquia.encontro.domain.enums.SobrinhoStatus;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "sobrinho")
public class Sobrinho {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;
    @Column(nullable = false, length = 150)
    private String nome;
    @Column(length = 30)
    private String telefone;
    @Column(name = "responsavel_nome", length = 150)
    private String responsavelNome;
    @Column(name = "responsavel_telefone", length = 30)
    private String responsavelTelefone;
    @Column(length = 180)
    private String endereco;
    @Column(name = "data_nascimento")
    private LocalDate dataNascimento;
    @Column(name = "restricao_alimentar", length = 500)
    private String restricaoAlimentar;
    @Column(name = "observacao_medica", length = 500)
    private String observacaoMedica;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SobrinhoStatus status = SobrinhoStatus.INSCRITO;
    @Column(nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    protected Sobrinho() {
    }

    public Sobrinho(Evento evento, String nome, String telefone, String responsavelNome, String responsavelTelefone, String endereco, LocalDate dataNascimento, String restricaoAlimentar, String observacaoMedica) {
        this.evento = evento;
        this.nome = nome;
        this.telefone = telefone;
        this.responsavelNome = responsavelNome;
        this.responsavelTelefone = responsavelTelefone;
        this.endereco = endereco;
        this.dataNascimento = dataNascimento;
        this.restricaoAlimentar = restricaoAlimentar;
        this.observacaoMedica = observacaoMedica;
    }

    public Long getId() {
        return id;
    }

    public Evento getEvento() {
        return evento;
    }

    public String getNome() {
        return nome;
    }

    public String getTelefone() {
        return telefone;
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

    public LocalDate getDataNascimento() {
        return dataNascimento;
    }

    public String getRestricaoAlimentar() {
        return restricaoAlimentar;
    }

    public String getObservacaoMedica() {
        return observacaoMedica;
    }

    public SobrinhoStatus getStatus() {
        return status;
    }
}
