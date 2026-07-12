package br.com.paroquia.encontro.domain.enums;

public enum PerfilUsuario {
    ADMIN("Administrador"),
    OPERADOR_ADMIN("Operador administrador"),
    OPERADOR_LEITURA("Operador leitura"),
    SOMENTE_LEITURA("Somente leitura");

    private final String descricao;

    PerfilUsuario(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
