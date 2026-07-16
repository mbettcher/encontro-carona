package br.com.paroquia.encontro.dto.relatorio;

public class CadernoEquipeRelatorioItem {
    private final Long equipeId;
    private final String equipeApelido;
    private final String equipeCorIdentificacao;
    private final String sobrinhoNome;
    private final String dupla;
    private final String tiosCarona;
    private final String status;
    private final String recebidoDaDuplaEm;
    private final String conferidoEm;
    private final String anexadoAoKitEm;
    private final String entregueAoSobrinhoEm;
    private final String observacao;
    private final String assinatura;

    public CadernoEquipeRelatorioItem(
            Long equipeId,
            String equipeApelido,
            String equipeCorIdentificacao,
            String sobrinhoNome,
            String dupla,
            String tiosCarona,
            String status,
            String recebidoDaDuplaEm,
            String conferidoEm,
            String anexadoAoKitEm,
            String entregueAoSobrinhoEm,
            String observacao
    ) {
        this.equipeId = equipeId;
        this.equipeApelido = equipeApelido;
        this.equipeCorIdentificacao = equipeCorIdentificacao;
        this.sobrinhoNome = sobrinhoNome;
        this.dupla = dupla;
        this.tiosCarona = tiosCarona;
        this.status = status;
        this.recebidoDaDuplaEm = recebidoDaDuplaEm;
        this.conferidoEm = conferidoEm;
        this.anexadoAoKitEm = anexadoAoKitEm;
        this.entregueAoSobrinhoEm = entregueAoSobrinhoEm;
        this.observacao = observacao;
        this.assinatura = "";
    }

    public Long getEquipeId() {
        return equipeId;
    }

    public String getEquipeApelido() {
        return equipeApelido;
    }

    public String getEquipeCorIdentificacao() {
        return equipeCorIdentificacao;
    }

    public String getSobrinhoNome() {
        return sobrinhoNome;
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

    public String getRecebidoDaDuplaEm() {
        return recebidoDaDuplaEm;
    }

    public String getConferidoEm() {
        return conferidoEm;
    }

    public String getAnexadoAoKitEm() {
        return anexadoAoKitEm;
    }

    public String getEntregueAoSobrinhoEm() {
        return entregueAoSobrinhoEm;
    }

    public String getObservacao() {
        return observacao;
    }

    public String getAssinatura() {
        return assinatura;
    }
}
