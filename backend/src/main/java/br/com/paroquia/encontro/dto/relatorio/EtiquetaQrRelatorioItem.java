package br.com.paroquia.encontro.dto.relatorio;

import java.awt.Image;

public class EtiquetaQrRelatorioItem {
    private final Image qrCode;
    private final String codigo;
    private final String nome;
    private final String tipo;
    private final String complemento;
    private final String evento;

    public EtiquetaQrRelatorioItem(
            Image qrCode,
            String codigo,
            String nome,
            String tipo,
            String complemento,
            String evento
    ) {
        this.qrCode = qrCode;
        this.codigo = codigo;
        this.nome = nome;
        this.tipo = tipo;
        this.complemento = complemento;
        this.evento = evento;
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
}
