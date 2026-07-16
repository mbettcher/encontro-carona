package br.com.paroquia.encontro.dto.relatorio;

public class ListaPresencaTioCaronaItem {
    private final Integer numero;
    private final String nome;
    private final String codigoIdentificacao;
    private final String status;
    private final String situacaoOperacional;
    private final String observacao;
    private final String assinatura;

    public ListaPresencaTioCaronaItem(
            Integer numero,
            String nome,
            String codigoIdentificacao,
            String status,
            String situacaoOperacional,
            String observacao
    ) {
        this.numero = numero;
        this.nome = nome;
        this.codigoIdentificacao = codigoIdentificacao;
        this.status = status;
        this.situacaoOperacional = situacaoOperacional;
        this.observacao = observacao;
        this.assinatura = "";
    }

    public Integer getNumero() {
        return numero;
    }

    public String getNome() {
        return nome;
    }

    public String getCodigoIdentificacao() {
        return codigoIdentificacao;
    }

    public String getStatus() {
        return status;
    }

    public String getSituacaoOperacional() {
        return situacaoOperacional;
    }

    public String getObservacao() {
        return observacao;
    }

    public String getAssinatura() {
        return assinatura;
    }
}
