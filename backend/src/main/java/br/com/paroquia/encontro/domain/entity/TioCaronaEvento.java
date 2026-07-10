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
        this.status = TioCaronaStatus.ATIVO;
        this.criadoEm = OffsetDateTime.now();
        this.codigoIdentificacao = gerarCodigoIdentificacao(evento, pessoa);
    }

    @PrePersist
    void prePersist() {
        if (this.criadoEm == null) {
            this.criadoEm = OffsetDateTime.now();
        }

        garantirCodigoIdentificacao();
    }

    public void garantirCodigoIdentificacao() {
        if (this.codigoIdentificacao == null || this.codigoIdentificacao.isBlank()) {
            this.codigoIdentificacao = gerarCodigoIdentificacao(this.evento, this.pessoa);
        }
    }

    public void registrarCheckinResumo(OffsetDateTime ocorridoEm) {
        validarAtivo();

        this.checkinRealizado = true;
        this.checkinEm = ocorridoEm;
        this.checkoutRealizado = false;
        this.checkoutEm = null;
    }

    public void registrarCheckoutResumo(OffsetDateTime ocorridoEm) {
        validarAtivo();

        this.checkoutRealizado = true;
        this.checkoutEm = ocorridoEm;
    }

    private void validarAtivo() {
        if (this.status != TioCaronaStatus.ATIVO) {
            throw new BusinessException("Tio carona inativo não pode realizar operação.");
        }
    }

    private String gerarCodigoIdentificacao(Evento evento, Pessoa pessoa) {
        if (evento == null || evento.getId() == null) {
            throw new BusinessException("Evento inválido para gerar código de identificação do tio carona.");
        }

        if (pessoa == null || pessoa.getId() == null) {
            throw new BusinessException("Pessoa inválida para gerar código de identificação do tio carona.");
        }

        return "TC-E%04d-P%06d".formatted(evento.getId(), pessoa.getId());
    }

    public void atualizarObservacoes(String observacoes) {
        this.observacoes = observacoes == null || observacoes.isBlank()
                ? null
                : observacoes.trim();
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