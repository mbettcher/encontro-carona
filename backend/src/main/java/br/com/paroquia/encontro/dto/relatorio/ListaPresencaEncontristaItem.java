package br.com.paroquia.encontro.dto.relatorio;

public class ListaPresencaEncontristaItem {
    private final Integer numero;
    private final String nome;
    private final String dupla;
    private final String tiosCarona;
    private final String status;
    private final String responsavel;
    private final String assinatura;
    private final String observacao;

    public ListaPresencaEncontristaItem(
            Integer numero,
            String nome,
            String dupla,
            String tiosCarona,
            String status,
            String responsavel,
            String observacao
    ) {
        this.numero = numero;
        this.nome = nome;
        this.dupla = dupla;
        this.tiosCarona = tiosCarona;
        this.status = status;
        this.responsavel = responsavel;
        this.assinatura = "";
        this.observacao = observacao;
    }

    public Integer getNumero() {
        return numero;
    }

    public String getNome() {
        return nome;
    }

    public String getDupla() {
        return dupla;
    }

    public String getTiosCarona() {
        return tiosCarona;
    }

    public String getStatus() {
        return status;
    }

    public String getResponsavel() {
        return responsavel;
    }

    public String getAssinatura() {
        return assinatura;
    }

    public String getObservacao() {
        return observacao;
    }
}
