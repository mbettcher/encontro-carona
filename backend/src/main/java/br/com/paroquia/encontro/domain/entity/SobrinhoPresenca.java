package br.com.paroquia.encontro.domain.entity;

import br.com.paroquia.encontro.domain.enums.OrigemPresencaSobrinho;
import br.com.paroquia.encontro.domain.enums.SobrinhoStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

@Entity
@Table(name = "sobrinho_presenca")
public class SobrinhoPresenca {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "O evento deve ser informado.")
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

    @NotNull(message = "O sobrinho deve ser informado.")
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "sobrinho_id", nullable = false)
    private Sobrinho sobrinho;

    @NotNull(message = "O status da presença é obrigatório.")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SobrinhoStatus status;

    @NotNull(message = "A origem da presença é obrigatória.")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrigemPresencaSobrinho origem;

    @Size(max = 500, message = "A observação não pode ter mais de 500 caracteres.")
    @Column(length = 500)
    private String observacao;

    @NotNull(message = "A data do ocorrido deve ser preenchida.")
    @Column(name = "ocorrido_em", nullable = false)
    private OffsetDateTime ocorridoEm = OffsetDateTime.now();

    protected SobrinhoPresenca() {
    }

    public SobrinhoPresenca(
            Evento evento,
            Sobrinho sobrinho,
            SobrinhoStatus status,
            OrigemPresencaSobrinho origem,
            String observacao
    ) {
        this.evento = evento;
        this.sobrinho = sobrinho;
        this.status = status;
        this.origem = origem;
        this.observacao = observacao;
        this.ocorridoEm = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Evento getEvento() {
        return evento;
    }

    public Sobrinho getSobrinho() {
        return sobrinho;
    }

    public SobrinhoStatus getStatus() {
        return status;
    }

    public OrigemPresencaSobrinho getOrigem() {
        return origem;
    }

    public String getObservacao() {
        return observacao;
    }

    public OffsetDateTime getOcorridoEm() {
        return ocorridoEm;
    }
}
