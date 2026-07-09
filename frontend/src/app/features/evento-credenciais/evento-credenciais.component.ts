import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import {
    CredencialEvento,
    StatusCredencial,
    TipoCredencial
} from '../../shared/models';
import { EventoCredenciaisService } from './evento-credenciais.service';

@Component({
    selector: 'app-evento-credenciais',
    standalone: true,
    imports: [
        DatePipe,
        FormsModule,
        RouterLink,
        ButtonModule,
        CardModule,
        InputTextModule,
        SelectModule,
        TableModule,
        TagModule,
        TooltipModule
    ],
    templateUrl: './evento-credenciais.component.html',
    styleUrl: './evento-credenciais.component.scss'
})
export class EventoCredenciaisComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly service = inject(EventoCredenciaisService);
    private readonly messageService = inject(MessageService);
    private readonly router = inject(Router);

    readonly eventoId = Number(this.route.snapshot.paramMap.get('eventoId'));

    readonly credenciais = signal<CredencialEvento[]>([]);
    readonly carregando = signal(false);
    readonly gerando = signal(false);
    readonly processandoCredencialId = signal<number | null>(null);

    readonly filtroTexto = signal('');
    readonly filtroTipo = signal<TipoCredencial | null>(null);
    readonly filtroStatus = signal<StatusCredencial | null>(null);

    readonly opcoesTipo = [
        { label: 'Todos os tipos', value: null },
        { label: 'Tio carona', value: 'TIO_CARONA' as TipoCredencial },
        { label: 'Sobrinho', value: 'SOBRINHO' as TipoCredencial }
    ];

    readonly opcoesStatus = [
        { label: 'Todos os status', value: null },
        { label: 'Ativa', value: 'ATIVA' as StatusCredencial },
        { label: 'Inativa', value: 'INATIVA' as StatusCredencial },
        { label: 'Cancelada', value: 'CANCELADA' as StatusCredencial }
    ];

    readonly credenciaisAtivas = computed(() =>
        this.credenciais().filter(credencial => credencial.status === 'ATIVA')
    );

    readonly credenciaisTios = computed(() =>
        this.credenciais().filter(credencial => credencial.tipo === 'TIO_CARONA')
    );

    readonly credenciaisSobrinhos = computed(() =>
        this.credenciais().filter(credencial => credencial.tipo === 'SOBRINHO')
    );

    readonly credenciaisFiltradas = computed(() => {
        const filtro = this.normalizarFiltro(this.filtroTexto());
        const tipo = this.filtroTipo();
        const status = this.filtroStatus();

        return this.credenciais()
            .filter(credencial => !tipo || credencial.tipo === tipo)
            .filter(credencial => !status || credencial.status === status)
            .filter(credencial => {
                if (!filtro) {
                    return true;
                }

                return this.contemFiltro(credencial.codigo, filtro) ||
                    this.contemFiltro(this.nomePrincipal(credencial), filtro) ||
                    this.contemFiltro(credencial.responsavelNome, filtro) ||
                    this.contemFiltro(credencial.duplaCodigo, filtro) ||
                    this.contemFiltro(credencial.duplaApelido, filtro) ||
                    this.contemFiltro(credencial.tipo, filtro) ||
                    this.contemFiltro(credencial.status, filtro) ||
                    this.contemFiltro(this.labelTipo(credencial.tipo), filtro) ||
                    this.contemFiltro(this.labelStatus(credencial.status), filtro);
            });
    });

    ngOnInit(): void {
        this.carregar();
    }

    carregar(): void {
        this.carregando.set(true);

        this.service.listar(this.eventoId)
            .pipe(finalize(() => this.carregando.set(false)))
            .subscribe({
                next: credenciais => this.credenciais.set(credenciais),
                error: erro => {
                    console.error('Erro ao carregar credenciais', erro);
                    this.toastError(this.mensagemErro(erro, 'Não foi possível carregar as credenciais.'));
                }
            });
    }

    alterarFiltroTexto(valor: string): void {
        this.filtroTexto.set(valor);
    }

    alterarFiltroTipo(valor: TipoCredencial | null): void {
        this.filtroTipo.set(valor);
    }

    alterarFiltroStatus(valor: StatusCredencial | null): void {
        this.filtroStatus.set(valor);
    }

    gerarTodas(): void {
        this.gerando.set(true);

        this.service.gerarTodas(this.eventoId)
            .pipe(finalize(() => this.gerando.set(false)))
            .subscribe({
                next: resultado => {
                    this.toastSuccess(
                        `Credenciais atualizadas. Criadas: ${resultado.criadas}. Já existentes: ${resultado.existentes}. Total: ${resultado.total}.`
                    );

                    this.carregar();
                },
                error: erro => {
                    console.error('Erro ao gerar credenciais', erro);
                    this.toastError(this.mensagemErro(erro, 'Não foi possível gerar as credenciais.'));
                }
            });
    }

    gerarTiosCarona(): void {
        this.gerarPorTipo('TIO_CARONA');
    }

    gerarSobrinhos(): void {
        this.gerarPorTipo('SOBRINHO');
    }

    inativar(credencial: CredencialEvento): void {
        this.processandoCredencialId.set(credencial.id);

        this.service.inativar(this.eventoId, credencial.id)
            .pipe(finalize(() => this.processandoCredencialId.set(null)))
            .subscribe({
                next: atualizada => {
                    this.atualizarCredencialNaLista(atualizada);
                    this.toastSuccess('Credencial inativada.');
                },
                error: erro => {
                    console.error('Erro ao inativar credencial', erro);
                    this.toastError(this.mensagemErro(erro, 'Não foi possível inativar a credencial.'));
                }
            });
    }

    reativar(credencial: CredencialEvento): void {
        this.processandoCredencialId.set(credencial.id);

        this.service.reativar(this.eventoId, credencial.id)
            .pipe(finalize(() => this.processandoCredencialId.set(null)))
            .subscribe({
                next: atualizada => {
                    this.atualizarCredencialNaLista(atualizada);
                    this.toastSuccess('Credencial reativada.');
                },
                error: erro => {
                    console.error('Erro ao reativar credencial', erro);
                    this.toastError(this.mensagemErro(erro, 'Não foi possível reativar a credencial.'));
                }
            });
    }

    cancelar(credencial: CredencialEvento): void {
        this.processandoCredencialId.set(credencial.id);

        this.service.cancelar(this.eventoId, credencial.id)
            .pipe(finalize(() => this.processandoCredencialId.set(null)))
            .subscribe({
                next: atualizada => {
                    this.atualizarCredencialNaLista(atualizada);
                    this.toastSuccess('Credencial cancelada.');
                },
                error: erro => {
                    console.error('Erro ao cancelar credencial', erro);
                    this.toastError(this.mensagemErro(erro, 'Não foi possível cancelar a credencial.'));
                }
            });
    }

    imprimirQrCodes(tipo?: TipoCredencial): void {
        const queryParams = tipo ? { tipo } : {};

        this.router.navigate(
            ['/eventos', this.eventoId, 'credenciais', 'impressao-qrcode'],
            { queryParams }
        );
    }

    imprimirQrCodeIndividual(credencial: CredencialEvento): void {
        if (credencial.status !== 'ATIVA') {
            this.toastError('Somente credenciais ativas podem ser impressas.');
            return;
        }

        this.router.navigate(
            ['/eventos', this.eventoId, 'credenciais', 'impressao-qrcode'],
            {
                queryParams: {
                    credencialId: credencial.id
                }
            }
        );
    }

    imprimirCrachas(tipo?: TipoCredencial): void {
        const queryParams = tipo ? { tipo } : {};

        this.router.navigate(
            ['/eventos', this.eventoId, 'credenciais', 'impressao-crachas'],
            { queryParams }
        );
    }

    imprimirCrachaIndividual(credencial: CredencialEvento): void {
        if (credencial.status !== 'ATIVA') {
            this.toastError('Somente credenciais ativas podem ser impressas.');
            return;
        }

        this.router.navigate(
            ['/eventos', this.eventoId, 'credenciais', 'impressao-crachas'],
            {
                queryParams: {
                    credencialId: credencial.id
                }
            }
        );
    }

    podeInativar(credencial: CredencialEvento): boolean {
        return credencial.status === 'ATIVA';
    }

    podeReativar(credencial: CredencialEvento): boolean {
        return credencial.status === 'INATIVA';
    }

    podeCancelar(credencial: CredencialEvento): boolean {
        return credencial.status !== 'CANCELADA';
    }

    nomePrincipal(credencial: CredencialEvento): string {
        if (credencial.tipo === 'TIO_CARONA') {
            return credencial.pessoaNome || 'Tio carona';
        }

        return credencial.sobrinhoNome || 'Sobrinho';
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

    labelStatus(status: StatusCredencial): string {
        switch (status) {
            case 'ATIVA':
                return 'Ativa';
            case 'INATIVA':
                return 'Inativa';
            case 'CANCELADA':
                return 'Cancelada';
            default:
                return status;
        }
    }

    severityStatus(status: StatusCredencial): 'success' | 'warn' | 'danger' | 'secondary' {
        switch (status) {
            case 'ATIVA':
                return 'success';
            case 'INATIVA':
                return 'warn';
            case 'CANCELADA':
                return 'danger';
            default:
                return 'secondary';
        }
    }

    private gerarPorTipo(tipo: TipoCredencial): void {
        this.gerando.set(true);

        const requisicao = tipo === 'TIO_CARONA'
            ? this.service.gerarTiosCarona(this.eventoId)
            : this.service.gerarSobrinhos(this.eventoId);

        requisicao
            .pipe(finalize(() => this.gerando.set(false)))
            .subscribe({
                next: resultado => {
                    this.toastSuccess(
                        `Credenciais atualizadas. Criadas: ${resultado.criadas}. Já existentes: ${resultado.existentes}. Total: ${resultado.total}.`
                    );

                    this.carregar();
                },
                error: erro => {
                    console.error('Erro ao gerar credenciais por tipo', erro);
                    this.toastError(this.mensagemErro(erro, 'Não foi possível gerar as credenciais.'));
                }
            });
    }

    private atualizarCredencialNaLista(atualizada: CredencialEvento): void {
        this.credenciais.update(credenciais =>
            credenciais.map(credencial =>
                credencial.id === atualizada.id ? atualizada : credencial
            )
        );
    }

    private normalizarFiltro(valor: string): string {
        return valor.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    private contemFiltro(valor: string | number | undefined | null, filtro: string): boolean {
        if (valor === undefined || valor === null) {
            return false;
        }

        return this.normalizarFiltro(String(valor)).includes(filtro);
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

    private toastSuccess(detail: string): void {
        this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail
        });
    }

    private toastError(detail: string): void {
        this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail
        });
    }
}