package br.com.paroquia.encontro.domain.entity;

import br.com.paroquia.encontro.domain.enums.StatusCadernoChoro;
import br.com.paroquia.encontro.domain.enums.TipoMovimentacaoCaderno;
import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.time.ZoneId;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_montagem_kit_id")
    private EquipeMontagemKit equipeMontagemKit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tio_carona_evento_id")
    private TioCaronaEvento tioCaronaEvento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_responsavel_id")
    private UsuarioSistema usuarioResponsavel;

    /**
     * Campo legado mantido para compatibilidade com consultas e respostas
     * existentes. Representa o status resultante da movimentação.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private StatusCadernoChoro status;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_movimentacao", nullable = false, length = 50)
    private TipoMovimentacaoCaderno tipoMovimentacao;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_anterior", length = 40)
    private StatusCadernoChoro statusAnterior;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_novo", nullable = false, length = 40)
    private StatusCadernoChoro statusNovo;

    @Column(name = "numero_via", nullable = false)
    private Integer numeroVia;

    @Column(length = 40)
    private String motivo;

    @Column(length = 500)
    private String observacao;

    @Column(name = "ocorrido_em", nullable = false)
    private OffsetDateTime ocorridoEm = OffsetDateTime.now(ZoneId.systemDefault());

    protected CadernoChoroHistorico() {
    }

    /**
     * Construtor legado mantido para os serviços atuais.
     * O tipo da movimentação é inferido pelo status resultante até que
     * o serviço passe a registrar explicitamente todos os dados da
     * transição no bloco A2.2.
     */
    public CadernoChoroHistorico(
            CadernoChoro caderno,
            StatusCadernoChoro status,
            String observacao
    ) {
        this(
                caderno,
                inferirTipoMovimentacao(status),
                null,
                status,
                null,
                null,
                null,
                observacao
        );
    }

    public CadernoChoroHistorico(
            CadernoChoro caderno,
            TipoMovimentacaoCaderno tipoMovimentacao,
            StatusCadernoChoro statusAnterior,
            StatusCadernoChoro statusNovo,
            TioCaronaEvento tioCaronaEvento,
            UsuarioSistema usuarioResponsavel,
            String motivo,
            String observacao
    ) {
        if (caderno == null) {
            throw new IllegalArgumentException(
                    "Caderno de Mensagens deve ser informado."
            );
        }

        if (tipoMovimentacao == null) {
            throw new IllegalArgumentException(
                    "Tipo da movimentação deve ser informado."
            );
        }

        if (statusNovo == null) {
            throw new IllegalArgumentException(
                    "Status resultante da movimentação deve ser informado."
            );
        }

        this.evento = caderno.getEvento();
        this.caderno = caderno;
        this.dupla = caderno.getDupla();
        this.sobrinho = caderno.getSobrinho();
        this.equipeMontagemKit = caderno.getEquipeMontagemKit();
        this.tioCaronaEvento = tioCaronaEvento;
        this.usuarioResponsavel = usuarioResponsavel;

        this.status = statusNovo;
        this.tipoMovimentacao = tipoMovimentacao;
        this.statusAnterior = statusAnterior;
        this.statusNovo = statusNovo;
        this.numeroVia = caderno.getNumeroVia();

        this.motivo = normalizarTexto(motivo);
        this.observacao = normalizarTexto(observacao);
        this.ocorridoEm = OffsetDateTime.now(ZoneId.systemDefault());
    }

    private static TipoMovimentacaoCaderno inferirTipoMovimentacao(
            StatusCadernoChoro status
    ) {
        if (status == null) {
            return TipoMovimentacaoCaderno.MOVIMENTACAO_LEGADA;
        }

        return switch (status) {
            case PENDENTE ->
                    TipoMovimentacaoCaderno.CADERNO_GERADO;

            case ENTREGUE_A_DUPLA ->
                    TipoMovimentacaoCaderno.ENTREGA_A_DUPLA;

            case RECEBIDO_DA_DUPLA ->
                    TipoMovimentacaoCaderno.RECEBIMENTO_DA_DUPLA;

            case DIRECIONADO_EQUIPE_MONTAGEM ->
                    TipoMovimentacaoCaderno.DIRECIONAMENTO_EQUIPE;

            case CONFERIDO ->
                    TipoMovimentacaoCaderno.CONFERENCIA;

            case ANEXADO_AO_KIT ->
                    TipoMovimentacaoCaderno.ANEXACAO_KIT;

            case ENTREGUE_AO_SOBRINHO ->
                    TipoMovimentacaoCaderno.ENTREGA_ENCONTRISTA;

            case PERDIDO ->
                    TipoMovimentacaoCaderno.PERDA_REGISTRADA;

            case DANIFICADO ->
                    TipoMovimentacaoCaderno.DANO_REGISTRADO;

            case SUBSTITUIDO ->
                    TipoMovimentacaoCaderno.CADERNO_SUBSTITUIDO;

            case CANCELADO ->
                    TipoMovimentacaoCaderno.CADERNO_CANCELADO;
        };
    }

    private static String normalizarTexto(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }

        return valor.trim();
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

    public EquipeMontagemKit getEquipeMontagemKit() {
        return equipeMontagemKit;
    }

    public TioCaronaEvento getTioCaronaEvento() {
        return tioCaronaEvento;
    }

    public UsuarioSistema getUsuarioResponsavel() {
        return usuarioResponsavel;
    }

    public StatusCadernoChoro getStatus() {
        return status;
    }

    public TipoMovimentacaoCaderno getTipoMovimentacao() {
        return tipoMovimentacao;
    }

    public StatusCadernoChoro getStatusAnterior() {
        return statusAnterior;
    }

    public StatusCadernoChoro getStatusNovo() {
        return statusNovo;
    }

    public Integer getNumeroVia() {
        return numeroVia;
    }

    public String getMotivo() {
        return motivo;
    }

    public String getObservacao() {
        return observacao;
    }

    public OffsetDateTime getOcorridoEm() {
        return ocorridoEm;
    }
}