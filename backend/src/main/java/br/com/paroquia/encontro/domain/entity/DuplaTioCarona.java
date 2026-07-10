package br.com.paroquia.encontro.domain.entity;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.domain.enums.DuplaStatus;
import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "dupla_tio_carona")
public class DuplaTioCarona {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "tio_1_id", nullable = false)
    private TioCaronaEvento tio1;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "tio_2_id", nullable = false)
    private TioCaronaEvento tio2;

    @Column(name = "codigo", nullable = false, length = 40, unique = true)
    private String codigo;

    @Column(name = "apelido", length = 120)
    private String apelido;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DuplaStatus status = DuplaStatus.ATIVA;

    @Column(nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    protected DuplaTioCarona() {
    }

    public DuplaTioCarona(Evento evento, TioCaronaEvento tio1, TioCaronaEvento tio2, String codigo, String apelido) {
        this.evento = evento;
        this.tio1 = tio1;
        this.tio2 = tio2;
        this.codigo = codigo;
        this.apelido = apelido;
    }

    public void inativar() {
        if (this.status == DuplaStatus.INATIVA) {
            throw new BusinessException("A dupla já está inativa.");
        }

        this.status = DuplaStatus.INATIVA;
    }

    public void reativar() {
        if (this.status == DuplaStatus.ATIVA) {
            throw new BusinessException("A dupla já está ativa.");
        }

        this.status = DuplaStatus.ATIVA;
    }

    public void atualizarApelido(String apelido) {
        this.apelido = apelido == null || apelido.isBlank()
                ? null
                : apelido.trim();
    }

    public Long getId() {
        return id;
    }

    public Evento getEvento() {
        return evento;
    }

    public TioCaronaEvento getTio1() {
        return tio1;
    }

    public TioCaronaEvento getTio2() {
        return tio2;
    }

    public String getCodigo() {
        return codigo;
    }

    public String getApelido() {
        return apelido;
    }

    public DuplaStatus getStatus() {
        return status;
    }
}