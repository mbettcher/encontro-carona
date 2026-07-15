package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.domain.entity.RefreshToken;
import br.com.paroquia.encontro.domain.entity.UsuarioSistema;
import br.com.paroquia.encontro.repository.RefreshTokenRepository;
import br.com.paroquia.encontro.security.RefreshTokenResultado;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class RefreshTokenService {
    private static final int TOKEN_BYTES = 48;

    private final RefreshTokenRepository repository;
    private final SecureRandom secureRandom = new SecureRandom();
    private final long expirationDays;

    public RefreshTokenService(
            RefreshTokenRepository repository,
            @Value("${app.security.refresh-token-expiration-days:7}") long expirationDays
    ) {
        this.repository = repository;
        this.expirationDays = expirationDays;
    }

    @Transactional
    public String emitir(UsuarioSistema usuario) {
        var token = gerarTokenSeguro();
        var tokenHash = hash(token);
        var expiraEm = OffsetDateTime.now().plusDays(expirationDays);

        repository.save(new RefreshToken(usuario, tokenHash, expiraEm));

        return token;
    }

    @Transactional
    public RefreshTokenResultado rotacionar(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BusinessException("Sessão expirada. Faça login novamente.");
        }

        var tokenHash = hash(refreshToken);
        var tokenAtual = repository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BusinessException("Sessão expirada. Faça login novamente."));

        if (tokenAtual.estaRevogado() || tokenAtual.estaExpirado()) {
            throw new BusinessException("Sessão expirada. Faça login novamente.");
        }

        var usuario = tokenAtual.getUsuario();

        if (!usuario.isAtivo()) {
            tokenAtual.revogar();
            throw new BusinessException("Usuário inativo.");
        }

        var novoRefreshToken = gerarTokenSeguro();
        var novoRefreshTokenHash = hash(novoRefreshToken);

        tokenAtual.registrarUso();
        tokenAtual.revogar(novoRefreshTokenHash);

        repository.save(new RefreshToken(
                usuario,
                novoRefreshTokenHash,
                OffsetDateTime.now().plusDays(expirationDays)
        ));

        return new RefreshTokenResultado(usuario, novoRefreshToken);
    }

    @Transactional
    public void revogar(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }

        repository.findByTokenHash(hash(refreshToken))
                .filter(token -> !token.estaRevogado())
                .ifPresent(RefreshToken::revogar);
    }

    @Transactional
    public void revogarTodosAtivosDoUsuario(Long usuarioId) {
        repository.revogarTodosAtivosDoUsuario(usuarioId, OffsetDateTime.now());
    }

    private String gerarTokenSeguro() {
        var bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String token) {
        try {
            var digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(digest);
        } catch (Exception ex) {
            throw new IllegalStateException("Não foi possível gerar hash do refresh token.", ex);
        }
    }
}
