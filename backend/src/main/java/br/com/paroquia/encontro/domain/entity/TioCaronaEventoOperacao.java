package br.com.paroquia.encontro.domain.entity;

import br.com.paroquia.encontro.domain.enums.OrigemOperacaoTioCarona;
import br.com.paroquia.encontro.domain.enums.TipoOperacaoTioCarona;
import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "tio_carona_evento_operacao")
public class TioCaronaEventoOperacao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "tio_carona_evento_id", nullable = false)
    private TioCaronaEvento tioCaronaEvento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoOperacaoTioCarona tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrigemOperacaoTioCarona origem;

    @Column(name = "codigo_identificacao", length = 80)
    private String codigoIdentificacao;

    @Column(name = "ocorrido_em", nullable = false)
    private OffsetDateTime ocorridoEm = OffsetDateTime.now();

    protected TioCaronaEventoOperacao() {
    }

    public TioCaronaEventoOperacao(
            Evento evento,
            TioCaronaEvento tioCaronaEvento,
            TipoOperacaoTioCarona tipo,
            OrigemOperacaoTioCarona origem,
            String codigoIdentificacao
    ) {
        this.evento = evento;
        this.tioCaronaEvento = tioCaronaEvento;
        this.tipo = tipo;
        this.origem = origem;
        this.codigoIdentificacao = codigoIdentificacao;
        this.ocorridoEm = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Evento getEvento() {
        return evento;
    }

    public TioCaronaEvento getTioCaronaEvento() {
        return tioCaronaEvento;
    }

    public TipoOperacaoTioCarona getTipo() {
        return tipo;
    }

    public OrigemOperacaoTioCarona getOrigem() {
        return origem;
    }

    public String getCodigoIdentificacao() {
        return codigoIdentificacao;
    }

    public OffsetDateTime getOcorridoEm() {
        return ocorridoEm;
    }
}