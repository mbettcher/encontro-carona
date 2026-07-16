package br.com.paroquia.encontro.domain.entity;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.domain.enums.StatusEquipeMontagemKit;
import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Entity
@Table(
        name = "equipe_montagem_kit",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_equipe_montagem_kit_evento_apelido",
                columnNames = {"evento_id", "apelido"}
        )
)
public class EquipeMontagemKit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

    @Column(nullable = false, length = 80)
    private String apelido;

    @Column(name = "cor_identificacao", length = 30)
    private String corIdentificacao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusEquipeMontagemKit status = StatusEquipeMontagemKit.ATIVA;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    @OneToMany(mappedBy = "equipe", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<EquipeMontagemKitIntegrante> integrantes = new ArrayList<>();

    protected EquipeMontagemKit() {
    }

    public EquipeMontagemKit(Evento evento, String apelido, String corIdentificacao) {
        this.evento = evento;
        this.apelido = normalizarObrigatorio(apelido, "O apelido da equipe deve ser informado.");
        this.corIdentificacao = normalizarOpcional(corIdentificacao);
        this.status = StatusEquipeMontagemKit.ATIVA;
        this.criadoEm = OffsetDateTime.now();
    }

    public void atualizar(String apelido, String corIdentificacao) {
        this.apelido = normalizarObrigatorio(apelido, "O apelido da equipe deve ser informado.");
        this.corIdentificacao = normalizarOpcional(corIdentificacao);
    }

    public void inativar() {
        if (this.status == StatusEquipeMontagemKit.INATIVA) {
            throw new BusinessException("A equipe de montagem do kit já está inativa.");
        }

        this.status = StatusEquipeMontagemKit.INATIVA;
    }

    public void reativar() {
        if (this.status == StatusEquipeMontagemKit.ATIVA) {
            throw new BusinessException("A equipe de montagem do kit já está ativa.");
        }

        this.status = StatusEquipeMontagemKit.ATIVA;
    }

    public void adicionarIntegrante(Pessoa pessoa) {
        if (pessoa == null) {
            throw new BusinessException("A pessoa integrante deve ser informada.");
        }

        var jaExiste = this.integrantes.stream()
                .anyMatch(integrante -> integrante.getPessoa().getId().equals(pessoa.getId()));

        if (jaExiste) {
            throw new BusinessException("Esta pessoa já é integrante da equipe.");
        }

        this.integrantes.add(new EquipeMontagemKitIntegrante(this, pessoa));
    }

    public void removerIntegrante(Long integranteId) {
        var removido = this.integrantes.removeIf(integrante -> integrante.getId().equals(integranteId));

        if (!removido) {
            throw new BusinessException("Integrante não encontrado nesta equipe.");
        }
    }

    private String normalizarObrigatorio(String valor, String mensagem) {
        if (valor == null || valor.isBlank()) {
            throw new BusinessException(mensagem);
        }

        return valor.trim();
    }

    private String normalizarOpcional(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

    public Long getId() {
        return id;
    }

    public Evento getEvento() {
        return evento;
    }

    public String getApelido() {
        return apelido;
    }

    public String getCorIdentificacao() {
        return corIdentificacao;
    }

    public StatusEquipeMontagemKit getStatus() {
        return status;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }

    public List<EquipeMontagemKitIntegrante> getIntegrantes() {
        return Collections.unmodifiableList(integrantes);
    }
}
