package br.com.paroquia.encontro.domain.entity;

import br.com.paroquia.encontro.domain.enums.StatusCadernoChoro;
import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "caderno_choro_historico")
public class CadernoChoroHistorico {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "caderno_id", nullable = false)
    private CadernoChoro caderno;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "dupla_id", nullable = false)
    private DuplaTioCarona dupla;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "sobrinho_id", nullable = false)
    private Sobrinho sobrinho;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private StatusCadernoChoro status;

    @Column(length = 500)
    private String observacao;

    @Column(name = "ocorrido_em", nullable = false)
    private OffsetDateTime ocorridoEm = OffsetDateTime.now();

    protected CadernoChoroHistorico() {
    }

    public CadernoChoroHistorico(
            CadernoChoro caderno,
            StatusCadernoChoro status,
            String observacao
    ) {
        this.evento = caderno.getEvento();
        this.caderno = caderno;
        this.dupla = caderno.getDupla();
        this.sobrinho = caderno.getSobrinho();
        this.status = status;
        this.observacao = observacao == null || observacao.isBlank() ? null : observacao.trim();
        this.ocorridoEm = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Evento getEvento() {
        return evento;
    }

    public CadernoChoro getCaderno() {
        return caderno;
    }

    public DuplaTioCarona getDupla() {
        return dupla;
    }

    public Sobrinho getSobrinho() {
        return sobrinho;
    }

    public StatusCadernoChoro getStatus() {
        return status;
    }

    public String getObservacao() {
        return observacao;
    }

    public OffsetDateTime getOcorridoEm() {
        return ocorridoEm;
    }
}