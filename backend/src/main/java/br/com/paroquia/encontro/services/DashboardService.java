package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.Evento;
import br.com.paroquia.encontro.domain.entity.SobrinhoPresenca;
import br.com.paroquia.encontro.domain.enums.DuplaStatus;
import br.com.paroquia.encontro.domain.enums.EventoStatus;
import br.com.paroquia.encontro.domain.enums.SobrinhoStatus;
import br.com.paroquia.encontro.domain.enums.StatusCadernoChoro;
import br.com.paroquia.encontro.domain.enums.StatusCredencial;
import br.com.paroquia.encontro.domain.enums.TipoCredencial;
import br.com.paroquia.encontro.domain.enums.TipoOperacaoTioCarona;
import br.com.paroquia.encontro.domain.enums.TioCaronaStatus;
import br.com.paroquia.encontro.domain.enums.VinculoStatus;
import br.com.paroquia.encontro.dto.response.DashboardBaseResumoResponse;
import br.com.paroquia.encontro.dto.response.DashboardEventoResumoResponse;
import br.com.paroquia.encontro.dto.response.DashboardResumoResponse;
import br.com.paroquia.encontro.repository.CadernoChoroRepository;
import br.com.paroquia.encontro.repository.CredencialEventoRepository;
import br.com.paroquia.encontro.repository.DuplaTioCaronaRepository;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.ParoquiaRepository;
import br.com.paroquia.encontro.repository.PessoaRepository;
import br.com.paroquia.encontro.repository.SobrinhoDuplaRepository;
import br.com.paroquia.encontro.repository.SobrinhoPresencaRepository;
import br.com.paroquia.encontro.repository.SobrinhoRepository;
import br.com.paroquia.encontro.repository.TioCaronaEventoOperacaoRepository;
import br.com.paroquia.encontro.repository.TioCaronaEventoRepository;
import br.com.paroquia.encontro.repository.UsuarioSistemaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {
    private final EventoRepository eventoRepository;
    private final PessoaRepository pessoaRepository;
    private final ParoquiaRepository paroquiaRepository;
    private final UsuarioSistemaRepository usuarioSistemaRepository;
    private final TioCaronaEventoRepository tioCaronaEventoRepository;
    private final DuplaTioCaronaRepository duplaTioCaronaRepository;
    private final SobrinhoRepository sobrinhoRepository;
    private final SobrinhoDuplaRepository sobrinhoDuplaRepository;
    private final CadernoChoroRepository cadernoChoroRepository;
    private final CredencialEventoRepository credencialEventoRepository;
    private final SobrinhoPresencaRepository sobrinhoPresencaRepository;
    private final TioCaronaEventoOperacaoRepository tioCaronaEventoOperacaoRepository;

    public DashboardService(
            EventoRepository eventoRepository,
            PessoaRepository pessoaRepository,
            ParoquiaRepository paroquiaRepository,
            UsuarioSistemaRepository usuarioSistemaRepository,
            TioCaronaEventoRepository tioCaronaEventoRepository,
            DuplaTioCaronaRepository duplaTioCaronaRepository,
            SobrinhoRepository sobrinhoRepository,
            SobrinhoDuplaRepository sobrinhoDuplaRepository,
            CadernoChoroRepository cadernoChoroRepository,
            CredencialEventoRepository credencialEventoRepository,
            SobrinhoPresencaRepository sobrinhoPresencaRepository,
            TioCaronaEventoOperacaoRepository tioCaronaEventoOperacaoRepository
    ) {
        this.eventoRepository = eventoRepository;
        this.pessoaRepository = pessoaRepository;
        this.paroquiaRepository = paroquiaRepository;
        this.usuarioSistemaRepository = usuarioSistemaRepository;
        this.tioCaronaEventoRepository = tioCaronaEventoRepository;
        this.duplaTioCaronaRepository = duplaTioCaronaRepository;
        this.sobrinhoRepository = sobrinhoRepository;
        this.sobrinhoDuplaRepository = sobrinhoDuplaRepository;
        this.cadernoChoroRepository = cadernoChoroRepository;
        this.credencialEventoRepository = credencialEventoRepository;
        this.sobrinhoPresencaRepository = sobrinhoPresencaRepository;
        this.tioCaronaEventoOperacaoRepository = tioCaronaEventoOperacaoRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResumoResponse resumo(Long eventoId) {
        var base = new DashboardBaseResumoResponse(
                eventoRepository.count(),
                pessoaRepository.count(),
                paroquiaRepository.count(),
                usuarioSistemaRepository.count()
        );

        var evento = selecionarEvento(eventoId);
        var eventoResumo = evento == null ? null : montarEventoResumo(evento);

        return new DashboardResumoResponse(
                OffsetDateTime.now(),
                evento == null ? null : evento.getId(),
                base,
                eventoResumo
        );
    }

    private Evento selecionarEvento(Long eventoId) {
        if (eventoId != null) {
            return eventoRepository.findById(eventoId)
                    .orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));
        }

        var eventos = eventoRepository.findAll();

        if (eventos.isEmpty()) {
            return null;
        }

        var hoje = LocalDate.now();

        return eventos.stream()
                .filter(evento -> evento.getStatus() == EventoStatus.EM_ANDAMENTO)
                .min(Comparator.comparing(Evento::getDataInicio))
                .or(() -> eventos.stream()
                        .filter(evento -> evento.getStatus() != EventoStatus.CANCELADO)
                        .filter(evento -> !evento.getDataInicio().isAfter(hoje) && !evento.getDataFim().isBefore(hoje))
                        .min(Comparator.comparing(Evento::getDataInicio)))
                .or(() -> eventos.stream()
                        .filter(evento -> evento.getStatus() != EventoStatus.CANCELADO)
                        .filter(evento -> !evento.getDataInicio().isBefore(hoje))
                        .min(Comparator.comparing(Evento::getDataInicio)))
                .or(() -> eventos.stream()
                        .filter(evento -> evento.getStatus() != EventoStatus.CANCELADO)
                        .max(Comparator.comparing(Evento::getDataInicio)))
                .orElseGet(() -> eventos.stream()
                        .max(Comparator.comparing(Evento::getDataInicio))
                        .orElse(null));
    }

    private DashboardEventoResumoResponse montarEventoResumo(Evento evento) {
        var eventoId = evento.getId();

        var tios = tioCaronaEventoRepository.findByEventoIdOrderByPessoaNomeAsc(eventoId);
        var duplas = duplaTioCaronaRepository.findByEventoIdOrderByCodigo(eventoId);
        var sobrinhos = sobrinhoRepository.findByEventoIdOrderByNomeAsc(eventoId);
        var vinculos = sobrinhoDuplaRepository.findByEventoIdOrderByDuplaCodigoAscSobrinhoNomeAsc(eventoId);
        var cadernos = cadernoChoroRepository.findByEventoIdOrderByDuplaCodigoAscSobrinhoNomeAsc(eventoId);
        var credenciais = credencialEventoRepository.findByEventoIdOrderByTipoAscCodigoAsc(eventoId);
        var presencas = sobrinhoPresencaRepository.findByEventoIdOrderByOcorridoEmDesc(eventoId);
        var operacoesTios = tioCaronaEventoOperacaoRepository.findByEventoIdOrderByOcorridoEmDesc(eventoId);

        var ultimasPresencasPorSobrinho = ultimasPresencasPorSobrinho(presencas);

        return new DashboardEventoResumoResponse(
                evento.getId(),
                evento.getNome(),
                evento.getTema(),
                evento.getParoquia().getNome(),
                evento.getDataInicio(),
                evento.getDataFim(),
                evento.getLocal(),
                evento.getStatus(),

                tios.size(),
                tios.stream().filter(tio -> tio.getStatus() == TioCaronaStatus.ATIVO).count(),
                tios.stream().filter(tio -> tio.isCheckinRealizado() && !tio.isCheckoutRealizado()).count(),
                tios.stream().filter(tio -> tio.isCheckoutRealizado()).count(),

                duplas.size(),
                duplas.stream().filter(dupla -> dupla.getStatus() == DuplaStatus.ATIVA).count(),

                sobrinhos.size(),
                sobrinhos.stream().filter(sobrinho -> sobrinho.getStatus() != SobrinhoStatus.DESISTENTE).count(),

                vinculos.size(),
                vinculos.stream().filter(vinculo -> vinculo.getStatus() == VinculoStatus.ATIVO).count(),

                cadernos.size(),
                cadernos.stream().filter(caderno -> caderno.getStatus() == StatusCadernoChoro.PENDENTE).count(),
                cadernos.stream().filter(caderno -> caderno.getStatus() == StatusCadernoChoro.ENTREGUE_A_DUPLA).count(),
                cadernos.stream().filter(caderno -> caderno.getStatus() == StatusCadernoChoro.RECEBIDO_DA_DUPLA).count(),
                cadernos.stream().filter(caderno -> caderno.getStatus() == StatusCadernoChoro.CONFERIDO).count(),
                cadernos.stream().filter(caderno -> caderno.getStatus() == StatusCadernoChoro.ANEXADO_AO_KIT).count(),
                cadernos.stream().filter(caderno -> caderno.getStatus() == StatusCadernoChoro.ENTREGUE_AO_SOBRINHO).count(),
                cadernos.stream().filter(caderno -> caderno.getStatus() == StatusCadernoChoro.PERDIDO).count(),
                cadernos.stream().filter(caderno -> caderno.getStatus() == StatusCadernoChoro.SUBSTITUIDO).count(),
                cadernos.stream().filter(caderno -> caderno.getStatus() == StatusCadernoChoro.CANCELADO).count(),

                credenciais.size(),
                credenciais.stream().filter(credencial -> credencial.getStatus() == StatusCredencial.ATIVA).count(),
                credenciais.stream().filter(credencial -> credencial.getStatus() == StatusCredencial.INATIVA).count(),
                credenciais.stream().filter(credencial -> credencial.getStatus() == StatusCredencial.CANCELADA).count(),
                credenciais.stream().filter(credencial -> credencial.getTipo() == TipoCredencial.TIO_CARONA).count(),
                credenciais.stream().filter(credencial -> credencial.getTipo() == TipoCredencial.SOBRINHO).count(),

                ultimasPresencasPorSobrinho.values().stream().filter(presenca -> presenca.getStatus() == SobrinhoStatus.PRESENTE).count(),
                ultimasPresencasPorSobrinho.values().stream().filter(presenca -> presenca.getStatus() == SobrinhoStatus.AUSENTE).count(),
                ultimasPresencasPorSobrinho.values().stream().filter(presenca -> presenca.getStatus() == SobrinhoStatus.DESISTENTE).count(),

                operacoesTios.stream().filter(operacao -> operacao.getTipo() == TipoOperacaoTioCarona.CHECKIN).count(),
                operacoesTios.stream().filter(operacao -> operacao.getTipo() == TipoOperacaoTioCarona.CHECKOUT).count()
        );
    }

    private Map<Long, SobrinhoPresenca> ultimasPresencasPorSobrinho(List<SobrinhoPresenca> presencas) {
        var resultado = new LinkedHashMap<Long, SobrinhoPresenca>();

        for (var presenca : presencas) {
            resultado.putIfAbsent(presenca.getSobrinho().getId(), presenca);
        }

        return resultado;
    }
}
