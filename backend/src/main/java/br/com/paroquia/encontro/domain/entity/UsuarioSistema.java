package br.com.paroquia.encontro.domain.entity;

import br.com.paroquia.encontro.domain.enums.PerfilUsuario;
import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(
        name = "usuario_sistema",
        indexes = {
                @Index(name = "idx_usuario_sistema_username", columnList = "username", unique = true),
                @Index(name = "idx_usuario_sistema_ativo", columnList = "ativo")
        }
)
public class UsuarioSistema {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, length = 120, unique = true)
    private String username;

    @Column(name = "senha_hash", nullable = false, length = 120)
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private PerfilUsuario perfil;

    @Column(nullable = false)
    private boolean ativo = true;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm = OffsetDateTime.now();

    protected UsuarioSistema() {
    }

    public UsuarioSistema(String nome, String username, String senhaHash, PerfilUsuario perfil) {
        this.nome = nome;
        this.username = normalizarUsername(username);
        this.senhaHash = senhaHash;
        this.perfil = perfil;
        this.ativo = true;
        this.criadoEm = OffsetDateTime.now();
        this.atualizadoEm = OffsetDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        var agora = OffsetDateTime.now();

        if (criadoEm == null) {
            criadoEm = agora;
        }

        atualizadoEm = agora;
        username = normalizarUsername(username);
    }

    @PreUpdate
    public void preUpdate() {
        atualizadoEm = OffsetDateTime.now();
        username = normalizarUsername(username);
    }

    private String normalizarUsername(String valor) {
        return valor == null ? null : valor.trim().toLowerCase();
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getUsername() {
        return username;
    }

    public String getSenhaHash() {
        return senhaHash;
    }

    public PerfilUsuario getPerfil() {
        return perfil;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }

    public OffsetDateTime getAtualizadoEm() {
        return atualizadoEm;
    }
}
