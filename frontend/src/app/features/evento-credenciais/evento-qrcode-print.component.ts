import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';

import {
    CredencialEvento,
    TipoCredencial
} from '../../shared/models';
import { EventoCredenciaisService } from './evento-credenciais.service';
import { EventoQrCodePrintService } from './evento-qrcode-print.service';

interface CredencialQrCodePrint {
    credencial: CredencialEvento;
    nome: string;
    subtitulo: string;
    qrCodeDataUrl: string;
}

@Component({
    selector: 'app-evento-qrcode-print',
    standalone: true,
    imports: [
        DatePipe,
        RouterLink,
        ButtonModule,
        ProgressSpinnerModule,
        TagModule
    ],
    templateUrl: './evento-qrcode-print.component.html',
    styleUrl: './evento-qrcode-print.component.scss'
})
export class EventoQrCodePrintComponent implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly credenciaisService = inject(EventoCredenciaisService);
    private readonly qrCodeService = inject(EventoQrCodePrintService);
    private readonly messageService = inject(MessageService);

    readonly eventoId = Number(this.route.snapshot.paramMap.get('eventoId'));

    readonly carregando = signal(false);
    readonly imprimindo = signal(false);

    readonly tipo = signal<TipoCredencial | null>(null);
    readonly credencialId = signal<number | null>(null);
    readonly credencialIds = signal<number[]>([]);

    readonly itens = signal<CredencialQrCodePrint[]>([]);

    readonly titulo = computed(() => {
        if (this.credencialId()) {
            return 'QR Code individual';
        }

        if (this.credencialIds().length > 0) {
            return 'QR Codes filtrados';
        }

        switch (this.tipo()) {
            case 'SOBRINHO':
                return 'QR Codes dos sobrinhos';
            case 'TIO_CARONA':
                return 'QR Codes dos tios carona';
            default:
                return 'QR Codes do evento';
        }
    });

    readonly descricao = computed(() => {
        if (this.credencialId()) {
            return 'Impressão individual de QR Code para adesivo ou identificação avulsa.';
        }

        if (this.credencialIds().length > 0) {
            return 'Impressão dos QR Codes ativos conforme os filtros selecionados na tela de credenciais.';
        }

        switch (this.tipo()) {
            case 'SOBRINHO':
                return 'Impressão em lote dos QR Codes dos sobrinhos para adesivos.';
            case 'TIO_CARONA':
                return 'Impressão em lote dos QR Codes dos tios carona para adesivos.';
            default:
                return 'Impressão em lote dos QR Codes ativos do evento.';
        }
    });

    private readonly aoFinalizarImpressao = (): void => {
        this.imprimindo.set(false);
    };

    ngOnInit(): void {
        document.body.classList.add('qrcode-print-mode');
        window.addEventListener('afterprint', this.aoFinalizarImpressao);

        this.lerParametros();
        this.carregar();
    }

    ngOnDestroy(): void {
        document.body.classList.remove('qrcode-print-mode');
        window.removeEventListener('afterprint', this.aoFinalizarImpressao);
    }

    imprimir(): void {
        if (this.carregando() || this.itens().length === 0) {
            this.toastError('Não há QR Codes disponíveis para impressão.');
            return;
        }

        this.imprimindo.set(true);

        window.setTimeout(() => {
            window.focus();
            window.print();

            window.setTimeout(() => {
                this.imprimindo.set(false);
            }, 800);
        }, 300);
    }

    private lerParametros(): void {
        const tipoParam = this.route.snapshot.queryParamMap.get('tipo');
        const credencialIdParam = this.route.snapshot.queryParamMap.get('credencialId');
        const idsParam = this.route.snapshot.queryParamMap.get('ids');

        if (tipoParam === 'SOBRINHO' || tipoParam === 'TIO_CARONA') {
            this.tipo.set(tipoParam);
        }

        if (credencialIdParam) {
            const id = Number(credencialIdParam);

            if (!Number.isNaN(id) && id > 0) {
                this.credencialId.set(id);
            }
        }

        if (idsParam) {
            const ids = idsParam
                .split(',')
                .map(id => Number(id.trim()))
                .filter(id => !Number.isNaN(id) && id > 0);

            this.credencialIds.set([...new Set(ids)]);
        }
    }

    private carregar(): void {
        this.carregando.set(true);

        this.credenciaisService.listar(this.eventoId, this.tipo())
            .pipe(finalize(() => this.carregando.set(false)))
            .subscribe({
                next: async credenciais => {
                    try {
                        const filtradas = this.filtrarCredenciais(credenciais);
                        const itens = await this.montarItens(filtradas);

                        this.itens.set(itens);
                    } catch (erro) {
                        console.error('Erro ao gerar QR Codes', erro);
                        this.toastError('Não foi possível gerar os QR Codes para impressão.');
                    }
                },
                error: erro => {
                    console.error('Erro ao carregar credenciais para impressão', erro);
                    this.toastError(this.mensagemErro(erro, 'Não foi possível carregar as credenciais.'));
                }
            });
    }

    private filtrarCredenciais(credenciais: CredencialEvento[]): CredencialEvento[] {
        const credencialId = this.credencialId();
        const credencialIds = this.credencialIds();
        const idsSelecionados = new Set(credencialIds);

        return credenciais
            .filter(credencial => credencial.status === 'ATIVA')
            .filter(credencial => !credencialId || credencial.id === credencialId)
            .filter(credencial => idsSelecionados.size === 0 || idsSelecionados.has(credencial.id))
            .sort((a, b) => this.nomePrincipal(a).localeCompare(this.nomePrincipal(b), 'pt-BR'));
    }

    private async montarItens(credenciais: CredencialEvento[]): Promise<CredencialQrCodePrint[]> {
        const itens = await Promise.all(
            credenciais.map(async credencial => ({
                credencial,
                nome: this.nomePrincipal(credencial),
                subtitulo: this.subtitulo(credencial),
                qrCodeDataUrl: await this.qrCodeService.gerarDataUrl(credencial.codigo)
            }))
        );

        return itens;
    }

    private nomePrincipal(credencial: CredencialEvento): string {
        if (credencial.tipo === 'TIO_CARONA') {
            return credencial.pessoaNome || 'Tio carona';
        }

        return credencial.sobrinhoNome || 'Sobrinho';
    }

    private subtitulo(credencial: CredencialEvento): string {
        if (credencial.tipo === 'TIO_CARONA') {
            return 'Tio carona';
        }

        return credencial.responsavelNome
            ? `Resp.: ${credencial.responsavelNome}`
            : 'Sobrinho';
    }

    labelTipo(tipo: TipoCredencial): string {
        switch (tipo) {
            case 'TIO_CARONA':
                return 'Tio carona';
            case 'SOBRINHO':
                return 'Sobrinho';
            default:
                return tipo;
        }
    }

    severityTipo(tipo: TipoCredencial): 'info' | 'success' | 'secondary' {
        switch (tipo) {
            case 'TIO_CARONA':
                return 'info';
            case 'SOBRINHO':
                return 'success';
            default:
                return 'secondary';
        }
    }

    private mensagemErro(erro: unknown, fallback: string): string {
        if (
            typeof erro === 'object' &&
            erro !== null &&
            'error' in erro
        ) {
            const corpo = (erro as {
                error?: {
                    message?: string;
                    detail?: string;
                    title?: string;
                    details?: string[];
                };
            }).error;

            if (corpo?.details?.length) {
                return corpo.details.join(' ');
            }

            return corpo?.message || corpo?.detail || corpo?.title || fallback;
        }

        return fallback;
    }

    private toastError(detail: string): void {
        this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail
        });
    }
}