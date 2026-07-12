package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.dto.request.LoginRequest;
import br.com.paroquia.encontro.dto.response.LoginResponse;
import br.com.paroquia.encontro.dto.response.UsuarioLogadoResponse;
import br.com.paroquia.encontro.repository.UsuarioSistemaRepository;
import br.com.paroquia.encontro.security.JwtService;
import br.com.paroquia.encontro.security.UsuarioAutenticado;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UsuarioSistemaRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UsuarioSistemaRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        var username = request.username() == null ? "" : request.username().trim().toLowerCase();

        var usuario = usuarioRepository.findByUsernameIgnoreCaseAndAtivoTrue(username)
                .orElseThrow(() -> new BusinessException("Usuário ou senha inválidos."));

        if (!passwordEncoder.matches(request.password(), usuario.getSenhaHash())) {
            throw new BusinessException("Usuário ou senha inválidos.");
        }

        return new LoginResponse(
                jwtService.gerarToken(usuario),
                "Bearer",
                jwtService.expirationSeconds(),
                UsuarioLogadoResponse.from(usuario)
        );
    }

    public UsuarioLogadoResponse me() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof UsuarioAutenticado usuario)) {
            throw new BusinessException("Sessão inválida.");
        }

        return new UsuarioLogadoResponse(
                usuario.id(),
                usuario.nome(),
                usuario.username(),
                usuario.perfil(),
                usuario.perfil().getDescricao()
        );
    }
}
