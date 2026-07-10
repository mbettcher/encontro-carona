package br.com.paroquia.encontro.domain.entity;

import br.com.paroquia.encontro.domain.enums.VinculoStatus;
import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "sobrinho_dupla")
public class SobrinhoDupla {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "sobrinho_id", nullable = false)
    private Sobrinho sobrinho;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "dupla_id", nullable = false)
    private DuplaTioCarona dupla;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private VinculoStatus status = VinculoStatus.ATIVO;

    @Column(nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    protected SobrinhoDupla() {
    }

    public SobrinhoDupla(Evento evento, Sobrinho sobrinho, DuplaTioCarona dupla) {
        this.evento = evento;
        this.sobrinho = sobrinho;
        this.dupla = dupla;
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

    public DuplaTioCarona getDupla() {
        return dupla;
    }

    public VinculoStatus getStatus() {
        return status;
    }
}
