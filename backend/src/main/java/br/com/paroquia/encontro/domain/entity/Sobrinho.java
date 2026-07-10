package br.com.paroquia.encontro.domain.entity;

import br.com.paroquia.encontro.domain.enums.SobrinhoStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "sobrinho")
public class Sobrinho {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "O evento deve ser informado.")
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pessoa_id")
    private Pessoa pessoa;

    @NotBlank(message = "O nome do sobrinho é obrigatório.")
    @Size(max = 150, message = "O nome não pode ter mais de 150 caracteres.")
    @Column(nullable = false, length = 150)
    private String nome;

    @Size(max = 30, message = "O telefone não pode ter mais de 30 caracteres.")
    @Column(length = 30)
    private String telefone;

    @NotBlank(message = "O nome do responsável é obrigatório.")
    @Size(max = 150, message = "O nome do responsável não pode ter mais de 150 caracteres.")
    @Column(name = "responsavel_nome", length = 150)
    private String responsavelNome;

    @NotBlank(message = "O telefone do responsável é obrigatório.")
    @Size(max = 30, message = "O telefone do responsável não pode ter mais de 30 caracteres.")
    @Column(name = "responsavel_telefone", length = 30)
    private String responsavelTelefone;

    @NotBlank(message = "O endereço é obrigatório.")
    @Size(max = 180, message = "O endereço não pode ter mais de 180 caracteres.")
    @Column(length = 180)
    private String endereco;

    @NotNull(message = "A data de nascimento é obrigatória.")
    @Past(message = "A data de nascimento deve ser uma data no passado.")
    @Column(name = "data_nascimento")
    private LocalDate dataNascimento;

    @Size(max = 500, message = "A restrição alimentar não pode ter mais de 500 caracteres.")
    @Column(name = "restricao_alimentar", length = 500)
    private String restricaoAlimentar;

    @Size(max = 500, message = "A observação médica não pode ter mais de 500 caracteres.")
    @Column(name = "observacao_medica", length = 500)
    private String observacaoMedica;

    @NotNull(message = "O status deve ser informado.")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SobrinhoStatus status = SobrinhoStatus.INSCRITO;

    @Column(nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    protected Sobrinho() {
    }

    public Sobrinho(
            Evento evento,
            String nome,
            String telefone,
            String responsavelNome,
            String responsavelTelefone,
            String endereco,
            LocalDate dataNascimento,
            String restricaoAlimentar,
            String observacaoMedica
    ) {
        this(evento, null, nome, telefone, responsavelNome, responsavelTelefone, endereco, dataNascimento, restricaoAlimentar, observacaoMedica);
    }

    public Sobrinho(
            Evento evento,
            Pessoa pessoa,
            String nome,
            String telefone,
            String responsavelNome,
            String responsavelTelefone,
            String endereco,
            LocalDate dataNascimento,
            String restricaoAlimentar,
            String observacaoMedica
    ) {
        this.evento = evento;
        this.pessoa = pessoa;
        this.nome = nome;
        this.telefone = telefone;
        this.responsavelNome = responsavelNome;
        this.responsavelTelefone = responsavelTelefone;
        this.endereco = endereco;
        this.dataNascimento = dataNascimento;
        this.restricaoAlimentar = restricaoAlimentar;
        this.observacaoMedica = observacaoMedica;
    }

    public void atualizarDados(
            String nome,
            String telefone,
            String responsavelNome,
            String responsavelTelefone,
            String endereco,
            LocalDate dataNascimento,
            String restricaoAlimentar,
            String observacaoMedica
    ) {
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

    public Pessoa getPessoa() {
        return pessoa;
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

    public void marcarPresente() {
        this.status = SobrinhoStatus.PRESENTE;
    }

    public void marcarAusente() {
        this.status = SobrinhoStatus.AUSENTE;
    }

    public void marcarDesistente() {
        this.status = SobrinhoStatus.DESISTENTE;
    }

    public void atualizarStatusPresenca(SobrinhoStatus status) {
        this.status = status;
    }
}
