package br.com.paroquia.encontro.security;

import br.com.paroquia.encontro.domain.entity.UsuarioSistema;
import br.com.paroquia.encontro.domain.enums.PerfilUsuario;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class JwtService {
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final ObjectMapper objectMapper;
    private final String secret;
    private final long expirationSeconds;

    public JwtService(
            ObjectMapper objectMapper,
            @Value("${app.security.jwt-secret}") String secret,
            @Value("${app.security.jwt-expiration-minutes:480}") long expirationMinutes
    ) {
        this.objectMapper = objectMapper;
        this.secret = secret;
        this.expirationSeconds = expirationMinutes * 60;
    }

    public long expirationSeconds() {
        return expirationSeconds;
    }

    public String gerarToken(UsuarioSistema usuario) {
        var agora = Instant.now().getEpochSecond();

        var header = new LinkedHashMap<String, Object>();
        header.put("alg", "HS256");
        header.put("typ", "JWT");

        var payload = new LinkedHashMap<String, Object>();
        payload.put("sub", usuario.getUsername());
        payload.put("uid", usuario.getId());
        payload.put("nome", usuario.getNome());
        payload.put("perfil", usuario.getPerfil().name());
        payload.put("iat", agora);
        payload.put("exp", agora + expirationSeconds);

        var headerEncoded = base64Url(toJson(header));
        var payloadEncoded = base64Url(toJson(payload));
        var unsigned = headerEncoded + "." + payloadEncoded;

        return unsigned + "." + assinar(unsigned);
    }

    public Optional<UsuarioAutenticado> validar(String token) {
        try {
            var partes = token.split("\\.");

            if (partes.length != 3) {
                return Optional.empty();
            }

            var unsigned = partes[0] + "." + partes[1];
            var assinaturaEsperada = assinar(unsigned);

            if (!assinaturaEsperada.equals(partes[2])) {
                return Optional.empty();
            }

            var payload = objectMapper.readValue(
                    Base64.getUrlDecoder().decode(partes[1]),
                    new TypeReference<Map<String, Object>>() {
                    }
            );

            var exp = ((Number) payload.get("exp")).longValue();

            if (Instant.now().getEpochSecond() >= exp) {
                return Optional.empty();
            }

            var id = ((Number) payload.get("uid")).longValue();
            var nome = String.valueOf(payload.get("nome"));
            var username = String.valueOf(payload.get("sub"));
            var perfil = PerfilUsuario.valueOf(String.valueOf(payload.get("perfil")));

            return Optional.of(new UsuarioAutenticado(id, nome, username, perfil));
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    private byte[] toJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsBytes(value);
        } catch (Exception ex) {
            throw new IllegalStateException("Não foi possível serializar o token.", ex);
        }
    }

    private String assinar(String value) {
        try {
            var mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            return base64Url(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Não foi possível assinar o token.", ex);
        }
    }

    private String base64Url(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }
}
