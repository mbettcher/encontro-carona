package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.util.EnumMap;

@Service
public class QrCodeImageService {
    public BufferedImage gerar(String conteudo, int tamanho) {
        if (conteudo == null || conteudo.isBlank()) {
            throw new BusinessException("Conteúdo do QR Code deve ser informado.");
        }

        try {
            var hints = new EnumMap<EncodeHintType, Object>(EncodeHintType.class);
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
            hints.put(EncodeHintType.MARGIN, 1);

            var bitMatrix = new QRCodeWriter()
                    .encode(conteudo.trim(), BarcodeFormat.QR_CODE, tamanho, tamanho, hints);

            var imagem = new BufferedImage(tamanho, tamanho, BufferedImage.TYPE_INT_RGB);

            for (int x = 0; x < tamanho; x++) {
                for (int y = 0; y < tamanho; y++) {
                    imagem.setRGB(x, y, bitMatrix.get(x, y)
                            ? Color.BLACK.getRGB()
                            : Color.WHITE.getRGB());
                }
            }

            return imagem;
        } catch (Exception ex) {
            throw new BusinessException("Não foi possível gerar a imagem do QR Code.");
        }
    }
}
