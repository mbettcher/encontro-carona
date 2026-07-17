package br.com.paroquia.encontro.dto.relatorio;

import java.awt.Image;

public class CrachaCredencialRelatorioItem {
    private final Image qrCode;
    private final String codigo;
    private final String nome;
    private final String tipo;
    private final String complemento;
    private final String evento;
    private final String detalhe;
    private final String rodape;

    public CrachaCredencialRelatorioItem(
            Image qrCode,
            String codigo,
            String nome,
            String tipo,
            String complemento,
            String evento,
            String detalhe,
            String rodape
    ) {
        this.qrCode = qrCode;
        this.codigo = codigo;
        this.nome = nome;
        this.tipo = tipo;
        this.complemento = complemento;
        this.evento = evento;
        this.detalhe = detalhe;
        this.rodape = rodape;
    }

    public Image getQrCode() {
        return qrCode;
    }

    public String getCodigo() {
        return codigo;
    }

    public String getNome() {
        return nome;
    }

    public String getTipo() {
        return tipo;
    }

    public String getComplemento() {
        return complemento;
    }

    public String getEvento() {
        return evento;
    }

    public String getDetalhe() {
        return detalhe;
    }

    public String getRodape() {
        return rodape;
    }
}
