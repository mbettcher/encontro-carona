import { Injectable } from '@angular/core';
import QRCode from 'qrcode';

@Injectable({
    providedIn: 'root'
})
export class EventoQrCodePrintService {
    async gerarDataUrl(valor: string): Promise<string> {
        return QRCode.toDataURL(valor, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 220
        });
    }
}