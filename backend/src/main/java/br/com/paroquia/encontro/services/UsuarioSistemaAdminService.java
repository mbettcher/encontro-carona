package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.UsuarioSistema;
import br.com.paroquia.encontro.domain.enums.PerfilUsuario;
import br.com.paroquia.encontro.dto.request.AtualizarUsuarioSistemaRequest;
import br.com.paroquia.encontro.dto.request.CriarUsuarioSistemaRequest;
import br.com.paroquia.encontro.dto.request.ResetarSenhaUsuarioSistemaRequest;
import br.com.paroquia.encontro.dto.response.UsuarioSistemaResponse;
import br.com.paroquia.encontro.repository.UsuarioSistemaRepository;
import br.com.paroquia.encontro.security.UsuarioAutenticado;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class UsuarioSistemaAdminService {
    private final UsuarioSistemaRepository repository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioSistemaAdminService(
            UsuarioSistemaRepository repository,
            PasswordEncoder passwordEncoder
    ) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UsuarioSistemaResponse> listar() {
        return repository.findAll().stream()
                .sorted(Comparator
                        .comparing(UsuarioSistema::isAtivo).reversed()
                        .thenComparing(usuario -> usuario.getNome().toLowerCase()))
                .map(UsuarioSistemaResponse::from)
                .toList();
    }

    @Transactional
    public UsuarioSistemaResponse criar(CriarUsuarioSistemaRequest request) {
        var username = normalizarUsername(request.username());

        if (repository.existsByUsernameIgnoreCase(username)) {
            throw new BusinessException("Já existe um usuário com este login.");
        }

        var usuario = new UsuarioSistema(
                normalizarNome(request.nome()),
                username,
                passwordEncoder.encode(request.senha()),
                request.perfil()
        );

        return UsuarioSistemaResponse.from(repository.save(usuario));
    }

    @Transactional
    public UsuarioSistemaResponse atualizar(Long id, AtualizarUsuarioSistemaRequest request) {
        var usuario = buscarEntidade(id);

        validarAutoRebaixamento(usuario, request.perfil());

        usuario.atualizarDados(
                normalizarNome(request.nome()),
                request.perfil()
        );

        return UsuarioSistemaResponse.from(usuario);
    }

    @Transactional
    public UsuarioSistemaResponse ativar(Long id) {
        var usuario = buscarEntidade(id);
        usuario.ativar();
        return UsuarioSistemaResponse.from(usuario);
    }

    @Transactional
    public UsuarioSistemaResponse desativar(Long id) {
        var usuario = buscarEntidade(id);

        if (isUsuarioLogado(usuario)) {
            throw new BusinessException("Você não pode desativar o próprio usuário.");
        }

        usuario.desativar();
        return UsuarioSistemaResponse.from(usuario);
    }

    @Transactional
    public UsuarioSistemaResponse resetarSenha(Long id, ResetarSenhaUsuarioSistemaRequest request) {
        var usuario = buscarEntidade(id);
        usuario.alterarSenha(passwordEncoder.encode(request.novaSenha()));
        return UsuarioSistemaResponse.from(usuario);
    }

    private UsuarioSistema buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
    }

    private void validarAutoRebaixamento(UsuarioSistema usuario, PerfilUsuario novoPerfil) {
        if (isUsuarioLogado(usuario) && novoPerfil != PerfilUsuario.ADMIN) {
            throw new BusinessException("Você não pode remover o perfil ADMIN do próprio usuário.");
        }
    }

    private boolean isUsuarioLogado(UsuarioSistema usuario) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof UsuarioAutenticado usuarioLogado)) {
            return false;
        }

        return usuario.getId() != null && usuario.getId().equals(usuarioLogado.id());
    }

    private String normalizarUsername(String valor) {
        return valor == null ? "" : valor.trim().toLowerCase();
    }

    private String normalizarNome(String valor) {
        return valor == null ? "" : valor.trim();
    }
}
