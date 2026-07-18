package br.com.paroquia.encontro.dto.relatorio;

public class ListaPresencaDuplaTioCaronaItem {
    private final Integer numero;
    private final String apelidoDupla;
    private final String paroquiaComunidadeNome;
    private final String paroquiaComunidadeEndereco;
    private final String tio1Nome;
    private final String tio2Nome;
    private final String assinatura1;
    private final String assinatura2;

    public ListaPresencaDuplaTioCaronaItem(
            Integer numero,
            String apelidoDupla,
            String paroquiaComunidadeNome,
            String paroquiaComunidadeEndereco,
            String tio1Nome,
            String tio2Nome
    ) {
        this.numero = numero;
        this.apelidoDupla = apelidoDupla;
        this.paroquiaComunidadeNome = paroquiaComunidadeNome;
        this.paroquiaComunidadeEndereco = paroquiaComunidadeEndereco;
        this.tio1Nome = tio1Nome;
        this.tio2Nome = tio2Nome;
        this.assinatura1 = "";
        this.assinatura2 = "";
    }

    public Integer getNumero() {
        return numero;
    }

    public String getApelidoDupla() {
        return apelidoDupla;
    }

    public String getParoquiaComunidadeNome() {
        return paroquiaComunidadeNome;
    }

    public String getParoquiaComunidadeEndereco() {
        return paroquiaComunidadeEndereco;
    }

    public String getTio1Nome() {
        return tio1Nome;
    }

    public String getTio2Nome() {
        return tio2Nome;
    }

    public String getAssinatura1() {
        return assinatura1;
    }

    public String getAssinatura2() {
        return assinatura2;
    }
}
