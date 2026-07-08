package br.com.paroquia.encontro.domain.entity;

import br.com.paroquia.encontro.domain.enums.TioCaronaStatus;
import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "tio_carona_evento", uniqueConstraints = @UniqueConstraint(name = "uk_tio_evento_pessoa", columnNames = {"evento_id", "pessoa_id"}))
public class TioCaronaEvento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TioCaronaStatus status = TioCaronaStatus.ATIVO;
    @Column(length = 500)
    private String observacoes;
    @Column(nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    protected TioCaronaEvento() {
    }

    public TioCaronaEvento(Evento evento, Pessoa pessoa, String observacoes) {
        this.evento = evento;
        this.pessoa = pessoa;
        this.observacoes = observacoes;
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

    public TioCaronaStatus getStatus() {
        return status;
    }

    public String getObservacoes() {
        return observacoes;
    }
}
