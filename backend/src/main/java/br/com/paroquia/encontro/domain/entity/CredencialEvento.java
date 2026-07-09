package br.com.paroquia.encontro.domain.entity;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.domain.enums.StatusCredencial;
import br.com.paroquia.encontro.domain.enums.TipoCredencial;
import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(
        name = "credencial_evento",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_credencial_evento_codigo", columnNames = "codigo"),
                @UniqueConstraint(name = "uk_credencial_evento_tio", columnNames = {"evento_id", "tio_carona_evento_id"}),
                @UniqueConstraint(name = "uk_credencial_evento_sobrinho", columnNames = {"evento_id", "sobrinho_id"})
        }
)
public class CredencialEvento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoCredencial tipo;

    @Column(nullable = false, length = 80)
    private String codigo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusCredencial status = StatusCredencial.ATIVA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tio_carona_evento_id")
    private TioCaronaEvento tioCaronaEvento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sobrinho_id")
    private Sobrinho sobrinho;

    @Column(nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    private OffsetDateTime atualizadoEm;

    protected CredencialEvento() {
    }

    public static CredencialEvento paraTioCarona(
            Evento evento,
            TioCaronaEvento tioCaronaEvento,
            String codigo
    ) {
        var credencial = new CredencialEvento();
        credencial.evento = evento;
        credencial.tipo = TipoCredencial.TIO_CARONA;
        credencial.tioCaronaEvento = tioCaronaEvento;
        credencial.codigo = codigo;
        credencial.status = StatusCredencial.ATIVA;
        credencial.criadoEm = OffsetDateTime.now();
        credencial.validarReferencia();

        return credencial;
    }

    public static CredencialEvento paraSobrinho(
            Evento evento,
            Sobrinho sobrinho,
            String codigo
    ) {
        var credencial = new CredencialEvento();
        credencial.evento = evento;
        credencial.tipo = TipoCredencial.SOBRINHO;
        credencial.sobrinho = sobrinho;
        credencial.codigo = codigo;
        credencial.status = StatusCredencial.ATIVA;
        credencial.criadoEm = OffsetDateTime.now();
        credencial.validarReferencia();

        return credencial;
    }

    public void inativar() {
        if (this.status == StatusCredencial.CANCELADA) {
            throw new BusinessException("Não é possível inativar uma credencial cancelada.");
        }

        this.status = StatusCredencial.INATIVA;
        this.atualizadoEm = OffsetDateTime.now();
    }

    public void reativar() {
        if (this.status == StatusCredencial.CANCELADA) {
            throw new BusinessException("Não é possível reativar uma credencial cancelada.");
        }

        this.status = StatusCredencial.ATIVA;
        this.atualizadoEm = OffsetDateTime.now();
    }

    public void cancelar() {
        this.status = StatusCredencial.CANCELADA;
        this.atualizadoEm = OffsetDateTime.now();
    }

    private void validarReferencia() {
        if (this.tipo == TipoCredencial.TIO_CARONA) {
            if (this.tioCaronaEvento == null || this.sobrinho != null) {
                throw new BusinessException("Credencial de tio carona deve estar vinculada somente a um tio carona do evento.");
            }
        }

        if (this.tipo == TipoCredencial.SOBRINHO) {
            if (this.sobrinho == null || this.tioCaronaEvento != null) {
                throw new BusinessException("Credencial de sobrinho deve estar vinculada somente a um sobrinho.");
            }
        }
    }

    public Long getId() {
        return id;
    }

    public Evento getEvento() {
        return evento;
    }

    public TipoCredencial getTipo() {
        return tipo;
    }

    public String getCodigo() {
        return codigo;
    }

    public StatusCredencial getStatus() {
        return status;
    }

    public TioCaronaEvento getTioCaronaEvento() {
        return tioCaronaEvento;
    }

    public Sobrinho getSobrinho() {
        return sobrinho;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }

    public OffsetDateTime getAtualizadoEm() {
        return atualizadoEm;
    }
}