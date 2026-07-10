package br.com.paroquia.encontro.domain.entity;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.domain.enums.StatusCadernoChoro;
import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(
        name = "caderno_choro",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_caderno_choro_evento_sobrinho",
                columnNames = {"evento_id", "sobrinho_id"}
        )
)
public class CadernoChoro {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "dupla_id", nullable = false)
    private DuplaTioCarona dupla;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "sobrinho_id", nullable = false)
    private Sobrinho sobrinho;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private StatusCadernoChoro status = StatusCadernoChoro.PENDENTE;

    @Column(name = "entregue_a_dupla_em")
    private OffsetDateTime entregueADuplaEm;

    @Column(name = "recebido_da_dupla_em")
    private OffsetDateTime recebidoDaDuplaEm;

    @Column(name = "conferido_em")
    private OffsetDateTime conferidoEm;

    @Column(name = "anexado_ao_kit_em")
    private OffsetDateTime anexadoAoKitEm;

    @Column(name = "entregue_ao_sobrinho_em")
    private OffsetDateTime entregueAoSobrinhoEm;

    @Column(length = 500)
    private String observacao;

    @Column(nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    protected CadernoChoro() {
    }

    public CadernoChoro(Evento evento, DuplaTioCarona dupla, Sobrinho sobrinho) {
        this.evento = evento;
        this.dupla = dupla;
        this.sobrinho = sobrinho;
        this.status = StatusCadernoChoro.PENDENTE;
        this.criadoEm = OffsetDateTime.now();
    }

    public void entregarADupla(String observacao) {
        validarStatusAtual(StatusCadernoChoro.PENDENTE, "Somente cadernos pendentes podem ser entregues à dupla.");

        this.status = StatusCadernoChoro.ENTREGUE_A_DUPLA;
        this.entregueADuplaEm = OffsetDateTime.now();
        atualizarObservacao(observacao);
    }

    public void receberDaDupla(String observacao) {
        validarStatusAtual(StatusCadernoChoro.ENTREGUE_A_DUPLA, "Somente cadernos entregues à dupla podem ser recebidos de volta pela equipe.");

        this.status = StatusCadernoChoro.RECEBIDO_DA_DUPLA;
        this.recebidoDaDuplaEm = OffsetDateTime.now();
        atualizarObservacao(observacao);
    }

    public void conferir(String observacao) {
        validarStatusAtual(StatusCadernoChoro.RECEBIDO_DA_DUPLA, "Somente cadernos recebidos da dupla podem ser conferidos.");

        this.status = StatusCadernoChoro.CONFERIDO;
        this.conferidoEm = OffsetDateTime.now();
        atualizarObservacao(observacao);
    }

    public void anexarAoKit(String observacao) {
        validarStatusAtual(StatusCadernoChoro.CONFERIDO, "Somente cadernos conferidos podem ser anexados ao kit.");

        this.status = StatusCadernoChoro.ANEXADO_AO_KIT;
        this.anexadoAoKitEm = OffsetDateTime.now();
        atualizarObservacao(observacao);
    }

    public void entregarAoSobrinho(String observacao) {
        validarStatusAtual(StatusCadernoChoro.ANEXADO_AO_KIT, "Somente cadernos anexados ao kit podem ser entregues ao sobrinho.");

        this.status = StatusCadernoChoro.ENTREGUE_AO_SOBRINHO;
        this.entregueAoSobrinhoEm = OffsetDateTime.now();
        atualizarObservacao(observacao);
    }

    public void marcarPerdido(String observacao) {
        if (this.status == StatusCadernoChoro.ENTREGUE_AO_SOBRINHO) {
            throw new BusinessException("Não é possível marcar como perdido um caderno já entregue ao sobrinho.");
        }

        if (this.status == StatusCadernoChoro.CANCELADO) {
            throw new BusinessException("Não é possível marcar como perdido um caderno cancelado.");
        }

        this.status = StatusCadernoChoro.PERDIDO;
        atualizarObservacao(observacao);
    }

    public void marcarSubstituido(String observacao) {
        if (this.status == StatusCadernoChoro.ENTREGUE_AO_SOBRINHO) {
            throw new BusinessException("Não é possível substituir um caderno já entregue ao sobrinho.");
        }

        if (this.status == StatusCadernoChoro.CANCELADO) {
            throw new BusinessException("Não é possível substituir um caderno cancelado.");
        }

        this.status = StatusCadernoChoro.SUBSTITUIDO;
        atualizarObservacao(observacao);
    }

    public void cancelar(String observacao) {
        if (this.status == StatusCadernoChoro.ENTREGUE_AO_SOBRINHO) {
            throw new BusinessException("Não é possível cancelar um caderno já entregue ao sobrinho.");
        }

        this.status = StatusCadernoChoro.CANCELADO;
        atualizarObservacao(observacao);
    }

    private void validarStatusAtual(StatusCadernoChoro esperado, String mensagem) {
        if (this.status != esperado) {
            throw new BusinessException(mensagem);
        }
    }

    private void atualizarObservacao(String observacao) {
        if (observacao != null && !observacao.isBlank()) {
            this.observacao = observacao.trim();
        }
    }

    public void substituirDuplaResponsavel(
            DuplaTioCarona novaDupla,
            String observacao,
            boolean confirmarCadernoDevolvido
    ) {
        if (novaDupla == null) {
            throw new BusinessException("Nova dupla responsável deve ser informada.");
        }

        this.dupla = novaDupla;
        atualizarObservacao(observacao);

        if (this.status == StatusCadernoChoro.ENTREGUE_A_DUPLA) {
            if (!confirmarCadernoDevolvido) {
                throw new BusinessException("Para substituir a dupla, confirme que o Caderno do Choro foi devolvido pela dupla anterior à equipe organizadora.");
            }

            this.status = StatusCadernoChoro.RECEBIDO_DA_DUPLA;
            this.recebidoDaDuplaEm = OffsetDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public Evento getEvento() {
        return evento;
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

    public OffsetDateTime getEntregueADuplaEm() {
        return entregueADuplaEm;
    }

    public OffsetDateTime getRecebidoDaDuplaEm() {
        return recebidoDaDuplaEm;
    }

    public OffsetDateTime getConferidoEm() {
        return conferidoEm;
    }

    public OffsetDateTime getAnexadoAoKitEm() {
        return anexadoAoKitEm;
    }

    public OffsetDateTime getEntregueAoSobrinhoEm() {
        return entregueAoSobrinhoEm;
    }

    public String getObservacao() {
        return observacao;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }
}