package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.dto.request.AlterarSenhaRequest;
import br.com.paroquia.encontro.dto.request.LoginRequest;
import br.com.paroquia.encontro.dto.response.LoginResponse;
import br.com.paroquia.encontro.dto.response.UsuarioLogadoResponse;
import br.com.paroquia.encontro.repository.UsuarioSistemaRepository;
import br.com.paroquia.encontro.security.JwtService;
import br.com.paroquia.encontro.security.UsuarioAutenticado;
import br.com.paroquia.encontro.validators.AuthServiceValidator;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UsuarioSistemaRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthServiceValidator validator;

    public AuthService(
            UsuarioSistemaRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthServiceValidator validator
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.validator = validator;
    }

    public LoginResponse login(LoginRequest request) {
        var username = request.username() == null ? "" : request.username().trim().toLowerCase();

        var usuario = usuarioRepository.findByUsernameIgnoreCaseAndAtivoTrue(username)
                .orElseThrow(() -> new BusinessException("Usuário ou senha inválidos."));

        validator.validarCredenciais(request.password(), usuario.getSenhaHash());

        return new LoginResponse(
                jwtService.gerarToken(usuario),
                "Bearer",
                jwtService.expirationSeconds(),
                UsuarioLogadoResponse.from(usuario)
        );
    }

    public UsuarioLogadoResponse me() {
        var usuario = usuarioLogado();

        return new UsuarioLogadoResponse(
                usuario.id(),
                usuario.nome(),
                usuario.username(),
                usuario.perfil(),
                usuario.perfil().getDescricao()
        );
    }

    @Transactional
    public void alterarSenha(AlterarSenhaRequest request) {
        var usuarioLogado = usuarioLogado();

        var usuario = usuarioRepository.findById(usuarioLogado.id())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        validator.validarUsuarioAtivo(usuario);
        validator.validarSenhaAtual(request.senhaAtual(), usuario.getSenhaHash());
        validator.validarNovaSenha(request, usuario.getSenhaHash());

        usuario.alterarSenha(passwordEncoder.encode(request.novaSenha()));
    }

    private UsuarioAutenticado usuarioLogado() {
        return validator.validarSessao(SecurityContextHolder.getContext().getAuthentication());
    }
}