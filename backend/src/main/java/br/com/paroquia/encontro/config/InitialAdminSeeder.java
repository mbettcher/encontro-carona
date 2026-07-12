package br.com.paroquia.encontro.config;

import br.com.paroquia.encontro.domain.entity.UsuarioSistema;
import br.com.paroquia.encontro.domain.enums.PerfilUsuario;
import br.com.paroquia.encontro.repository.UsuarioSistemaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class InitialAdminSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(InitialAdminSeeder.class);

    private final UsuarioSistemaRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final String adminUsername;
    private final String adminPassword;
    private final String adminName;

    public InitialAdminSeeder(
            UsuarioSistemaRepository repository,
            PasswordEncoder passwordEncoder,
            @Value("${app.security.initial-admin.username:admin}") String adminUsername,
            @Value("${app.security.initial-admin.password:Admin@123456}") String adminPassword,
            @Value("${app.security.initial-admin.name:Administrador}") String adminName
    ) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
        this.adminName = adminName;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (repository.count() > 0) {
            return;
        }

        var usuario = new UsuarioSistema(
                adminName,
                adminUsername,
                passwordEncoder.encode(adminPassword),
                PerfilUsuario.ADMIN
        );

        repository.save(usuario);

        log.warn(
                "Usuário administrador inicial criado: '{}'. Altere a senha após o primeiro acesso ou configure APP_ADMIN_INITIAL_PASSWORD em produção.",
                adminUsername
        );
    }
}
