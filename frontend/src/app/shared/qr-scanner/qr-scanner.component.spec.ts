import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrScannerComponent } from './qr-scanner.component';
import { QrScannerService } from './qr-scanner.service';

describe('QrScannerComponent', () => {
  let fixture: ComponentFixture<QrScannerComponent>;
  let component: QrScannerComponent;

  const scannerServiceMock = {
    iniciar: jasmine.createSpy('iniciar').and.resolveTo(),
    parar: jasmine.createSpy('parar'),
    listarCameras: jasmine
      .createSpy('listarCameras')
      .and.resolveTo([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrScannerComponent],
      providers: [
        {
          provide: QrScannerService,
          useValue: scannerServiceMock
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(QrScannerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ativo', false);
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve emitir código informado manualmente', () => {
    const emitSpy = spyOn(component.qrCodeLido, 'emit');

    component.codigoManual.set(' QR-TESTE ');
    component.registrarCodigoManual();

    expect(emitSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        texto: 'QR-TESTE',
        origem: 'MANUAL'
      })
    );
  });

  it('deve impedir repetição enquanto a leitura está sendo processada', () => {
    const emitSpy = spyOn(component.qrCodeLido, 'emit');

    fixture.componentRef.setInput('ativo', true);
    component.rearmarAgora();

    component.codigoManual.set('QR-REPETIDO');
    component.registrarCodigoManual();

    component.codigoManual.set('QR-REPETIDO');
    component.registrarCodigoManual();

    expect(emitSpy).toHaveBeenCalledTimes(1);
  });
});
