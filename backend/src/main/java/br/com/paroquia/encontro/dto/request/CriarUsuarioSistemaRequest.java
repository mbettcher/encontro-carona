package br.com.paroquia.encontro.dto.request;

import br.com.paroquia.encontro.domain.enums.PerfilUsuario;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CriarUsuarioSistemaRequest(
        @NotBlank(message = "Informe o nome.")
        @Size(max = 120, message = "O nome deve ter no máximo 120 caracteres.")
        String nome,

        @NotBlank(message = "Informe o usuário.")
        @Size(max = 120, message = "O usuário deve ter no máximo 120 caracteres.")
        String username,

        @NotBlank(message = "Informe a senha inicial.")
        @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres.")
        String senha,

        @NotNull(message = "Informe o perfil.")
        PerfilUsuario perfil
) {
}
