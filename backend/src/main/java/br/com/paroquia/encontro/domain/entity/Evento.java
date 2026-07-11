
package br.com.paroquia.encontro.domain.entity;

import br.com.paroquia.encontro.domain.enums.EventoStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "evento")
public class Evento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "paroquia_id", nullable = false)
    private Paroquia paroquia;

    @NotBlank
    @Column(nullable = false, length = 150)
    private String nome;

    @Column(length = 150)
    private String tema;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(name = "data_fim", nullable = false)
    private LocalDate dataFim;

    @Column(length = 180)
    private String local;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EventoStatus status = EventoStatus.PLANEJADO;

    @Column(name = "monitoramento_inicio")
    private LocalTime monitoramentoInicio;

    @Column(name = "monitoramento_fim")
    private LocalTime monitoramentoFim;

    @Column(name = "monitoramento_ativo", nullable = false)
    private boolean monitoramentoAtivo = false;

    @Column(nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    protected Evento() {
    }

    public Evento(Paroquia paroquia, String nome, String tema, LocalDate dataInicio, LocalDate dataFim, String local, LocalTime monitoramentoInicio, LocalTime monitoramentoFim) {
        this.paroquia = paroquia;
        this.nome = nome;
        this.tema = tema;
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.local = local;
        this.monitoramentoInicio = monitoramentoInicio;
        this.monitoramentoFim = monitoramentoFim;
    }

    public Long getId() {
        return id;
    }

    public Paroquia getParoquia() {
        return paroquia;
    }

    public String getNome() {
        return nome;
    }

    public String getTema() {
        return tema;
    }

    public LocalDate getDataInicio() {
        return dataInicio;
    }

    public LocalDate getDataFim() {
        return dataFim;
    }

    public String getLocal() {
        return local;
    }

    public EventoStatus getStatus() {
        return status;
    }

    public LocalTime getMonitoramentoInicio() {
        return monitoramentoInicio;
    }

    public LocalTime getMonitoramentoFim() {
        return monitoramentoFim;
    }

    public boolean isMonitoramentoAtivo() {
        return monitoramentoAtivo;
    }

    public void atualizar(String nome, String tema, LocalDate dataInicio, LocalDate dataFim, String local, EventoStatus status, LocalTime monitoramentoInicio, LocalTime monitoramentoFim, boolean monitoramentoAtivo) {
        this.nome = nome;
        this.tema = tema;
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.local = local;
        this.status = status == null ? EventoStatus.PLANEJADO : status;
        this.monitoramentoInicio = monitoramentoInicio;
        this.monitoramentoFim = monitoramentoFim;
        this.monitoramentoAtivo = monitoramentoAtivo;
    }
}