package br.com.paroquia.encontro.domain.entity;

import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(
        name = "equipe_montagem_kit_integrante",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_equipe_montagem_kit_integrante_pessoa",
                columnNames = {"equipe_id", "pessoa_id"}
        )
)
public class EquipeMontagemKitIntegrante {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_id", nullable = false)
    private EquipeMontagemKit equipe;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    protected EquipeMontagemKitIntegrante() {
    }

    public EquipeMontagemKitIntegrante(EquipeMontagemKit equipe, Pessoa pessoa) {
        this.equipe = equipe;
        this.pessoa = pessoa;
        this.criadoEm = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public EquipeMontagemKit getEquipe() {
        return equipe;
    }

    public Pessoa getPessoa() {
        return pessoa;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }
}
