package br.com.paroquia.encontro.domain.entity;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.domain.enums.MotivoCancelamentoCaderno;
import br.com.paroquia.encontro.domain.enums.MotivoEmissaoCaderno;
import br.com.paroquia.encontro.domain.enums.MotivoSubstituicaoCaderno;
import br.com.paroquia.encontro.domain.enums.StatusCadernoChoro;
import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Set;

@Entity
@Table(name = "caderno_choro")
public class CadernoChoro {

    private static final Set<StatusCadernoChoro> STATUS_PERMITEM_CONFERENCIA = Set.of(
            StatusCadernoChoro.RECEBIDO_DA_DUPLA,
            StatusCadernoChoro.DIRECIONADO_EQUIPE_MONTAGEM
    );

    private static final Set<StatusCadernoChoro> STATUS_FINAIS = Set.of(
            StatusCadernoChoro.ENTREGUE_AO_SOBRINHO,
            StatusCadernoChoro.SUBSTITUIDO,
            StatusCadernoChoro.CANCELADO
    );

    private static final Set<StatusCadernoChoro> STATUS_OCORRENCIA = Set.of(
            StatusCadernoChoro.PERDIDO,
            StatusCadernoChoro.DANIFICADO
    );

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_montagem_kit_id")
    private EquipeMontagemKit equipeMontagemKit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caderno_anterior_id")
    private CadernoChoro cadernoAnterior;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private StatusCadernoChoro status = StatusCadernoChoro.PENDENTE;

    @Column(name = "numero_via", nullable = false)
    private Integer numeroVia = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "motivo_emissao", nullable = false, length = 40)
    private MotivoEmissaoCaderno motivoEmissao =
            MotivoEmissaoCaderno.GERACAO_INICIAL;

    @Column(name = "via_atual", nullable = false)
    private boolean viaAtual = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_anterior_ocorrencia", length = 40)
    private StatusCadernoChoro statusAnteriorOcorrencia;

    @Enumerated(EnumType.STRING)
    @Column(name = "motivo_cancelamento", length = 40)
    private MotivoCancelamentoCaderno motivoCancelamento;

    @Enumerated(EnumType.STRING)
    @Column(name = "motivo_substituicao", length = 40)
    private MotivoSubstituicaoCaderno motivoSubstituicao;

    @Column(name = "entregue_a_dupla_em")
    private OffsetDateTime entregueADuplaEm;

    @Column(name = "recebido_da_dupla_em")
    private OffsetDateTime recebidoDaDuplaEm;

    @Column(name = "direcionado_equipe_montagem_em")
    private OffsetDateTime direcionadoEquipeMontagemEm;

    @Column(name = "conferido_em")
    private OffsetDateTime conferidoEm;

    @Column(name = "anexado_ao_kit_em")
    private OffsetDateTime anexadoAoKitEm;

    @Column(name = "entregue_ao_sobrinho_em")
    private OffsetDateTime entregueAoSobrinhoEm;

    @Column(name = "encerrado_em")
    private OffsetDateTime encerradoEm;

    @Column(length = 500)
    private String observacao;

    @Column(nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    protected CadernoChoro() {
    }

    /**
     * Construtor mantido para compatibilidade com o serviço atual.
     * Representa a geração da primeira via.
     */
    public CadernoChoro(
            Evento evento,
            DuplaTioCarona dupla,
            Sobrinho sobrinho
    ) {
        validarContextoObrigatorio(evento, dupla, sobrinho);

        this.evento = evento;
        this.dupla = dupla;
        this.sobrinho = sobrinho;
        this.status = StatusCadernoChoro.PENDENTE;
        this.numeroVia = 1;
        this.motivoEmissao = MotivoEmissaoCaderno.GERACAO_INICIAL;
        this.viaAtual = true;
        this.criadoEm = OffsetDateTime.now();
    }

    private CadernoChoro(
            Evento evento,
            DuplaTioCarona dupla,
            Sobrinho sobrinho,
            int numeroVia,
            MotivoEmissaoCaderno motivoEmissao,
            CadernoChoro cadernoAnterior
    ) {
        validarContextoObrigatorio(evento, dupla, sobrinho);

        if (numeroVia <= 1) {
            throw new BusinessException(
                    "Uma via substituta deve possuir número maior que 1."
            );
        }

        if (motivoEmissao == null
                || motivoEmissao == MotivoEmissaoCaderno.GERACAO_INICIAL) {
            throw new BusinessException(
                    "Informe um motivo válido para a geração da nova via."
            );
        }

        if (cadernoAnterior == null) {
            throw new BusinessException(
                    "A via anterior deve ser informada."
            );
        }

        if (!cadernoAnterior.getEvento().getId().equals(evento.getId())) {
            throw new BusinessException(
                    "A via anterior pertence a outro evento."
            );
        }

        if (!cadernoAnterior.getSobrinho().getId().equals(sobrinho.getId())) {
            throw new BusinessException(
                    "A via anterior pertence a outro encontrista."
            );
        }

        this.evento = evento;
        this.dupla = dupla;
        this.sobrinho = sobrinho;
        this.cadernoAnterior = cadernoAnterior;
        this.numeroVia = numeroVia;
        this.motivoEmissao = motivoEmissao;
        this.status = StatusCadernoChoro.PENDENTE;
        this.viaAtual = true;
        this.criadoEm = OffsetDateTime.now(ZoneId.systemDefault());
    }

    public static CadernoChoro criarViaSubstituta(
            CadernoChoro viaAnterior,
            DuplaTioCarona duplaAtual,
            MotivoEmissaoCaderno motivoEmissao
    ) {
        if (viaAnterior == null) {
            throw new BusinessException(
                    "A via anterior deve ser informada."
            );
        }

        return new CadernoChoro(
                viaAnterior.getEvento(),
                duplaAtual,
                viaAnterior.getSobrinho(),
                viaAnterior.getNumeroVia() + 1,
                motivoEmissao,
                viaAnterior
        );
    }

    public void entregarADupla(String observacao) {
        validarStatusAtual(
                StatusCadernoChoro.PENDENTE,
                "Somente cadernos pendentes podem ser entregues à dupla."
        );

        this.status = StatusCadernoChoro.ENTREGUE_A_DUPLA;
        this.entregueADuplaEm = OffsetDateTime.now(ZoneId.systemDefault());
        atualizarObservacao(observacao);
    }

    public void receberDaDupla(String observacao) {
        validarStatusAtual(
                StatusCadernoChoro.ENTREGUE_A_DUPLA,
                "Somente cadernos entregues à dupla podem ser recebidos " +
                        "de volta pela equipe."
        );

        this.status = StatusCadernoChoro.RECEBIDO_DA_DUPLA;
        this.recebidoDaDuplaEm = OffsetDateTime.now(ZoneId.systemDefault());
        atualizarObservacao(observacao);
    }

    public void direcionarEquipeMontagem(
            EquipeMontagemKit equipeMontagemKit,
            String observacao
    ) {
        if (equipeMontagemKit == null) {
            throw new BusinessException(
                    "Equipe de montagem do kit deve ser informada."
            );
        }

        if (this.status != StatusCadernoChoro.RECEBIDO_DA_DUPLA
                && this.status
                != StatusCadernoChoro.DIRECIONADO_EQUIPE_MONTAGEM) {
            throw new BusinessException(
                    "Somente cadernos recebidos da dupla podem ser " +
                            "direcionados para a equipe de montagem do kit."
            );
        }

        this.equipeMontagemKit = equipeMontagemKit;
        this.status = StatusCadernoChoro.DIRECIONADO_EQUIPE_MONTAGEM;
        this.direcionadoEquipeMontagemEm = OffsetDateTime.now(ZoneId.systemDefault());
        atualizarObservacao(observacao);
    }

    public void conferir(String observacao) {
        if (!STATUS_PERMITEM_CONFERENCIA.contains(this.status)) {
            throw new BusinessException(
                    "Somente cadernos recebidos da dupla ou direcionados à " +
                            "equipe de montagem podem ser conferidos."
            );
        }

        this.status = StatusCadernoChoro.CONFERIDO;
        this.conferidoEm = OffsetDateTime.now(ZoneId.systemDefault());
        atualizarObservacao(observacao);
    }

    public void anexarAoKit(String observacao) {
        validarStatusAtual(
                StatusCadernoChoro.CONFERIDO,
                "Somente cadernos conferidos podem ser anexados ao kit."
        );

        this.status = StatusCadernoChoro.ANEXADO_AO_KIT;
        this.anexadoAoKitEm = OffsetDateTime.now(ZoneId.systemDefault());
        atualizarObservacao(observacao);
    }

    public void entregarAoSobrinho(String observacao) {
        validarStatusAtual(
                StatusCadernoChoro.ANEXADO_AO_KIT,
                "Somente cadernos anexados ao kit podem ser entregues " +
                        "ao encontrista."
        );

        this.status = StatusCadernoChoro.ENTREGUE_AO_SOBRINHO;
        this.entregueAoSobrinhoEm = OffsetDateTime.now(ZoneId.systemDefault());
        this.encerradoEm = this.entregueAoSobrinhoEm;
        atualizarObservacao(observacao);
    }

    public void marcarPerdido(String observacao) {
        validarPodeRegistrarOcorrencia(
                "Não é possível marcar como perdido um Caderno de Mensagens finalizado."
        );

        guardarStatusAnteriorOcorrencia();

        this.status = StatusCadernoChoro.PERDIDO;
        atualizarObservacaoObrigatoria(
                observacao,
                "Informe uma observação sobre a perda do caderno."
        );
    }

    public void marcarDanificado(
            boolean impedeContinuacao,
            String observacao
    ) {
        validarPodeRegistrarOcorrencia(
                "Não é possível registrar dano em um Caderno de Mensagens finalizado."
        );

        atualizarObservacaoObrigatoria(
                observacao,
                "Informe uma observação sobre o dano do caderno."
        );

        /*
         * Um dano leve entra somente no histórico.
         * Um dano que impede o uso interrompe o fluxo operacional.
         */
        if (impedeContinuacao) {
            guardarStatusAnteriorOcorrencia();
            this.status = StatusCadernoChoro.DANIFICADO;
        }
    }

    public void recuperarDeOcorrencia(String observacao) {
        if (!STATUS_OCORRENCIA.contains(this.status)) {
            throw new BusinessException(
                    "Somente cadernos perdidos ou danificados podem ser recuperados."
            );
        }

        if (this.statusAnteriorOcorrencia == null) {
            throw new BusinessException(
                    "Não foi possível identificar a etapa anterior à ocorrência."
            );
        }

        this.status = this.statusAnteriorOcorrencia;
        this.statusAnteriorOcorrencia = null;
        atualizarObservacaoObrigatoria(
                observacao,
                "Informe uma observação sobre a recuperação do caderno."
        );
    }

    /**
     * Méthodo mantido para compatibilidade com o fluxo atual.
     * No bloco A2.2, a substituição será realizada pelo serviço dentro de
     * uma única transação: encerra esta via, desmarca viaAtual e cria a
     * próxima via como PENDENTE.
     */
    public void marcarSubstituido(String observacao) {
        marcarSubstituido(
                MotivoSubstituicaoCaderno.OUTRO,
                observacao
        );
    }

    public void marcarSubstituido(
            MotivoSubstituicaoCaderno motivo,
            String observacao
    ) {
        if (this.status == StatusCadernoChoro.ENTREGUE_AO_SOBRINHO) {
            throw new BusinessException(
                    "Não é possível substituir um Caderno de Mensagens " +
                            "já entregue ao encontrista."
            );
        }

        if (this.status == StatusCadernoChoro.CANCELADO) {
            throw new BusinessException(
                    "Não é possível substituir um Caderno de Mensagens cancelado."
            );
        }

        if (this.status == StatusCadernoChoro.SUBSTITUIDO) {
            throw new BusinessException(
                    "Esta via já foi substituída."
            );
        }

        this.status = StatusCadernoChoro.SUBSTITUIDO;
        this.motivoSubstituicao = motivo == null
                ? MotivoSubstituicaoCaderno.OUTRO
                : motivo;
        this.statusAnteriorOcorrencia = null;
        this.encerradoEm = OffsetDateTime.now(ZoneId.systemDefault());
        atualizarObservacaoObrigatoria(
                observacao,
                "Informe uma observação sobre a substituição do caderno."
        );
    }

    /**
     * A via anterior deixa de ser a versão mais recente somente depois
     * que a nova via foi criada com sucesso na mesma transação.
     */
    public void marcarComoViaAnterior() {
        if (!this.viaAtual) {
            throw new BusinessException(
                    "Esta via já não é a via atual."
            );
        }

        this.viaAtual = false;
    }

    public void cancelar(String observacao) {
        cancelar(
                MotivoCancelamentoCaderno.OUTRO,
                observacao
        );
    }

    public void cancelar(
            MotivoCancelamentoCaderno motivo,
            String observacao
    ) {
        if (this.status == StatusCadernoChoro.ENTREGUE_AO_SOBRINHO) {
            throw new BusinessException(
                    "Não é possível cancelar um Caderno de Mensagens " +
                            "já entregue ao encontrista."
            );
        }

        if (this.status == StatusCadernoChoro.SUBSTITUIDO) {
            throw new BusinessException(
                    "Não é possível cancelar uma via substituída."
            );
        }

        if (this.status == StatusCadernoChoro.CANCELADO) {
            throw new BusinessException(
                    "Este Caderno de Mensagens já está cancelado."
            );
        }

        this.status = StatusCadernoChoro.CANCELADO;
        this.motivoCancelamento = motivo == null
                ? MotivoCancelamentoCaderno.OUTRO
                : motivo;
        this.statusAnteriorOcorrencia = null;
        this.encerradoEm = OffsetDateTime.now(ZoneId.systemDefault());
        atualizarObservacaoObrigatoria(
                observacao,
                "Informe uma observação sobre o cancelamento do caderno."
        );
    }

    public void substituirDuplaResponsavel(
            DuplaTioCarona novaDupla,
            String observacao,
            boolean confirmarCadernoDevolvido
    ) {
        if (novaDupla == null) {
            throw new BusinessException(
                    "Nova dupla responsável deve ser informada."
            );
        }

        if (isFinalizado()) {
            throw new BusinessException(
                    "Não é possível alterar a dupla de uma via finalizada."
            );
        }

        /*
         * Quando o caderno estava com a dupla anterior, a devolução
         * precisa ser confirmada. Depois disso ele volta para PENDENTE,
         * aguardando uma nova entrega formal à nova dupla.
         */
        if (this.status == StatusCadernoChoro.ENTREGUE_A_DUPLA) {
            if (!confirmarCadernoDevolvido) {
                throw new BusinessException(
                        "Para substituir a dupla, confirme que o Caderno " +
                                "de Mensagens foi devolvido pela dupla " +
                                "anterior à equipe organizadora."
                );
            }

            this.recebidoDaDuplaEm = OffsetDateTime.now(ZoneId.systemDefault());
            this.status = StatusCadernoChoro.PENDENTE;
            this.entregueADuplaEm = null;
        }

        this.dupla = novaDupla;
        atualizarObservacao(observacao);
    }

    private void validarStatusAtual(
            StatusCadernoChoro esperado,
            String mensagem
    ) {
        if (this.status != esperado) {
            throw new BusinessException(mensagem);
        }
    }

    private void validarPodeRegistrarOcorrencia(String mensagem) {
        if (isFinalizado()) {
            throw new BusinessException(mensagem);
        }

        if (STATUS_OCORRENCIA.contains(this.status)) {
            throw new BusinessException(
                    "Já existe uma ocorrência aberta para este caderno."
            );
        }
    }

    private void guardarStatusAnteriorOcorrencia() {
        this.statusAnteriorOcorrencia = this.status;
    }

    private void atualizarObservacao(String observacao) {
        if (observacao != null && !observacao.isBlank()) {
            this.observacao = observacao.trim();
        }
    }

    private void atualizarObservacaoObrigatoria(
            String observacao,
            String mensagem
    ) {
        if (observacao == null || observacao.isBlank()) {
            throw new BusinessException(mensagem);
        }

        this.observacao = observacao.trim();
    }

    private static void validarContextoObrigatorio(
            Evento evento,
            DuplaTioCarona dupla,
            Sobrinho sobrinho
    ) {
        if (evento == null) {
            throw new BusinessException(
                    "Evento do Caderno de Mensagens deve ser informado."
            );
        }

        if (dupla == null) {
            throw new BusinessException(
                    "Dupla responsável pelo Caderno de Mensagens deve ser informada."
            );
        }

        if (sobrinho == null) {
            throw new BusinessException(
                    "Encontrista do Caderno de Mensagens deve ser informado."
            );
        }
    }

    public boolean isFinalizado() {
        return STATUS_FINAIS.contains(this.status);
    }

    public boolean possuiOcorrenciaAberta() {
        return STATUS_OCORRENCIA.contains(this.status);
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

    public EquipeMontagemKit getEquipeMontagemKit() {
        return equipeMontagemKit;
    }

    public CadernoChoro getCadernoAnterior() {
        return cadernoAnterior;
    }

    public StatusCadernoChoro getStatus() {
        return status;
    }

    public Integer getNumeroVia() {
        return numeroVia;
    }

    public MotivoEmissaoCaderno getMotivoEmissao() {
        return motivoEmissao;
    }

    public boolean isViaAtual() {
        return viaAtual;
    }

    public StatusCadernoChoro getStatusAnteriorOcorrencia() {
        return statusAnteriorOcorrencia;
    }

    public MotivoCancelamentoCaderno getMotivoCancelamento() {
        return motivoCancelamento;
    }

    public MotivoSubstituicaoCaderno getMotivoSubstituicao() {
        return motivoSubstituicao;
    }

    public OffsetDateTime getEntregueADuplaEm() {
        return entregueADuplaEm;
    }

    public OffsetDateTime getRecebidoDaDuplaEm() {
        return recebidoDaDuplaEm;
    }

    public OffsetDateTime getDirecionadoEquipeMontagemEm() {
        return direcionadoEquipeMontagemEm;
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

    public OffsetDateTime getEncerradoEm() {
        return encerradoEm;
    }

    public String getObservacao() {
        return observacao;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }
}