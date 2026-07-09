package br.com.paroquia.encontro.domain.entity;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.domain.enums.TioCaronaStatus;
import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(
        name = "tio_carona_evento",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_tio_evento_pessoa",
                        columnNames = {"evento_id", "pessoa_id"}
                ),
                @UniqueConstraint(
                        name = "uk_tio_carona_evento_codigo_identificacao",
                        columnNames = {"codigo_identificacao"}
                )
        }
)
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

    @Column(name = "codigo_identificacao", nullable = false, length = 80)
    private String codigoIdentificacao;

    @Column(name = "checkin_realizado", nullable = false)
    private boolean checkinRealizado = false;

    @Column(name = "checkin_em")
    private OffsetDateTime checkinEm;

    @Column(name = "checkout_realizado", nullable = false)
    private boolean checkoutRealizado = false;

    @Column(name = "checkout_em")
    private OffsetDateTime checkoutEm;

    @Column(nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    protected TioCaronaEvento() {
    }

    public TioCaronaEvento(Evento evento, Pessoa pessoa, String observacoes) {
        this.evento = evento;
        this.pessoa = pessoa;
        this.observacoes = observacoes;
    }

    @PrePersist
    void prePersist() {
        if (this.criadoEm == null) {
            this.criadoEm = OffsetDateTime.now();
        }
    }

    @PostPersist
    void postPersist() {
        if (this.codigoIdentificacao == null || this.codigoIdentificacao.isBlank()) {
            this.codigoIdentificacao = gerarCodigoIdentificacao(this.id);
        }
    }

    public void garantirCodigoIdentificacao() {
        if (this.codigoIdentificacao == null || this.codigoIdentificacao.isBlank()) {
            this.codigoIdentificacao = gerarCodigoIdentificacao(this.id);
        }
    }

    public void registrarCheckin() {
        validarAtivo();

        if (this.checkinRealizado) {
            throw new BusinessException("Check-in já realizado para este tio carona.");
        }

        if (this.checkoutRealizado) {
            throw new BusinessException("Não é possível realizar check-in após checkout.");
        }

        this.checkinRealizado = true;
        this.checkinEm = OffsetDateTime.now();
    }

    public void registrarCheckout() {
        validarAtivo();

        if (!this.checkinRealizado) {
            throw new BusinessException("Não é possível realizar checkout sem check-in.");
        }

        if (this.checkoutRealizado) {
            throw new BusinessException("Checkout já realizado para este tio carona.");
        }

        this.checkoutRealizado = true;
        this.checkoutEm = OffsetDateTime.now();
    }

    private void validarAtivo() {
        if (this.status != TioCaronaStatus.ATIVO) {
            throw new BusinessException("Tio carona inativo não pode realizar operação.");
        }
    }

    private String gerarCodigoIdentificacao(Long id) {
        return "TC-%06d".formatted(id);
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

    public String getCodigoIdentificacao() {
        return codigoIdentificacao;
    }

    public boolean isCheckinRealizado() {
        return checkinRealizado;
    }

    public OffsetDateTime getCheckinEm() {
        return checkinEm;
    }

    public boolean isCheckoutRealizado() {
        return checkoutRealizado;
    }

    public OffsetDateTime getCheckoutEm() {
        return checkoutEm;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }
}