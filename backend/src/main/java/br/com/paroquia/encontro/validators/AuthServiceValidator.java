package br.com.paroquia.encontro.validators;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.domain.entity.UsuarioSistema;
import br.com.paroquia.encontro.dto.request.AlterarSenhaRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import br.com.paroquia.encontro.security.UsuarioAutenticado;

@Component
public class AuthServiceValidator {

    private final PasswordEncoder passwordEncoder;

    public AuthServiceValidator(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    public void validarCredenciais(String senhaInformada, String senhaHash) {
        if (!passwordEncoder.matches(senhaInformada, senhaHash)) {
            throw new BusinessException("Usuário ou senha inválidos.");
        }
    }

    public void validarUsuarioAtivo(UsuarioSistema usuario) {
        if (!usuario.isAtivo()) {
            throw new BusinessException("Usuário inativo.");
        }
    }

    public void validarSenhaAtual(String senhaAtualInformada, String senhaHashAtual) {
        if (!passwordEncoder.matches(senhaAtualInformada, senhaHashAtual)) {
            throw new BusinessException("Senha atual inválida.");
        }
    }

    public void validarNovaSenha(AlterarSenhaRequest request, String senhaAtualHash) {
        var novaSenha = request.novaSenha() == null ? "" : request.novaSenha();
        var confirmacaoSenha = request.confirmacaoSenha() == null ? "" : request.confirmacaoSenha();

        if (!novaSenha.equals(confirmacaoSenha)) {
            throw new BusinessException("A confirmação da nova senha não confere.");
        }

        if (passwordEncoder.matches(novaSenha, senhaAtualHash)) {
            throw new BusinessException("A nova senha deve ser diferente da senha atual.");
        }

        if (novaSenha.length() < 8 || novaSenha.length() > 72) {
            throw new BusinessException("A nova senha deve ter entre 8 e 72 caracteres.");
        }

        if (!novaSenha.matches(".*[A-Z].*")) {
            throw new BusinessException("A nova senha deve conter pelo menos uma letra maiúscula.");
        }

        if (!novaSenha.matches(".*[a-z].*")) {
            throw new BusinessException("A nova senha deve conter pelo menos uma letra minúscula.");
        }

        if (!novaSenha.matches(".*\\d.*")) {
            throw new BusinessException("A nova senha deve conter pelo menos um número.");
        }

        if (!novaSenha.matches(".*[^A-Za-z0-9].*")) {
            throw new BusinessException("A nova senha deve conter pelo menos um caractere especial.");
        }
    }

    public UsuarioAutenticado validarSessao(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UsuarioAutenticado usuario)) {
            throw new BusinessException("Sessão inválida.");
        }

        return usuario;
    }
}