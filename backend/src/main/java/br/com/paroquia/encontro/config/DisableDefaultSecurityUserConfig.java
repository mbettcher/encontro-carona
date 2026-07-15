package br.com.paroquia.encontro.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

/**
 * Evita que o Spring Boot crie o usuário padrão em memória e exiba no log:
 * "Using generated security password".
 *
 * A autenticação real da aplicação é feita pelo AuthService + JWT,
 * usando a tabela usuario_sistema.
 */
@Configuration
public class DisableDefaultSecurityUserConfig {

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            throw new UsernameNotFoundException("Autenticação padrão do Spring Security desabilitada.");
        };
    }
}
