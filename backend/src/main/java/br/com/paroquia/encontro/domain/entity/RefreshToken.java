package br.com.paroquia.encontro.domain.entity;

import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(
        name = "refresh_token",
        indexes = {
                @Index(name = "idx_refresh_token_hash", columnList = "token_hash", unique = true),
                @Index(name = "idx_refresh_token_usuario", columnList = "usuario_id"),
                @Index(name = "idx_refresh_token_expira_em", columnList = "expira_em"),
                @Index(name = "idx_refresh_token_revogado_em", columnList = "revogado_em")
        }
)
public class RefreshToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private UsuarioSistema usuario;

    @Column(name = "token_hash", nullable = false, length = 128, unique = true)
    private String tokenHash;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    @Column(name = "expira_em", nullable = false)
    private OffsetDateTime expiraEm;

    @Column(name = "revogado_em")
    private OffsetDateTime revogadoEm;

    @Column(name = "substituido_por_hash", length = 128)
    private String substituidoPorHash;

    @Column(name = "ultimo_uso_em")
    private OffsetDateTime ultimoUsoEm;

    protected RefreshToken() {
    }

    public RefreshToken(UsuarioSistema usuario, String tokenHash, OffsetDateTime expiraEm) {
        this.usuario = usuario;
        this.tokenHash = tokenHash;
        this.expiraEm = expiraEm;
        this.criadoEm = OffsetDateTime.now();
    }

    public boolean estaRevogado() {
        return revogadoEm != null;
    }

    public boolean estaExpirado() {
        return OffsetDateTime.now().isAfter(expiraEm);
    }

    public void registrarUso() {
        this.ultimoUsoEm = OffsetDateTime.now();
    }

    public void revogar(String substituidoPorHash) {
        this.revogadoEm = OffsetDateTime.now();
        this.substituidoPorHash = substituidoPorHash;
    }

    public void revogar() {
        this.revogadoEm = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public UsuarioSistema getUsuario() {
        return usuario;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }

    public OffsetDateTime getExpiraEm() {
        return expiraEm;
    }

    public OffsetDateTime getRevogadoEm() {
        return revogadoEm;
    }

    public String getSubstituidoPorHash() {
        return substituidoPorHash;
    }

    public OffsetDateTime getUltimoUsoEm() {
        return ultimoUsoEm;
    }
}
