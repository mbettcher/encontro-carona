package br.com.paroquia.encontro.config;

import br.com.paroquia.encontro.security.JwtAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.time.OffsetDateTime;
import java.util.Map;

@Configuration
public class SecurityConfig {
    private static final String[] TODOS_PERFIS = {
            "ADMIN",
            "OPERADOR_ADMIN",
            "OPERADOR_LEITURA",
            "SOMENTE_LEITURA"
    };

    private static final String[] PERFIS_ESCRITA = {
            "ADMIN",
            "OPERADOR_ADMIN"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            ObjectMapper objectMapper
    ) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(401);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            objectMapper.writeValue(response.getWriter(), Map.of(
                                    "timestamp", OffsetDateTime.now().toString(),
                                    "status", 401,
                                    "error", "Unauthorized",
                                    "message", "Autenticação necessária.",
                                    "details", java.util.List.of()
                            ));
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(403);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            objectMapper.writeValue(response.getWriter(), Map.of(
                                    "timestamp", OffsetDateTime.now().toString(),
                                    "status", 403,
                                    "error", "Forbidden",
                                    "message", "Você não tem permissão para executar esta operação.",
                                    "details", java.util.List.of()
                            ));
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/login", "/api/auth/refresh", "/api/auth/logout").permitAll()
                        .requestMatchers("/api/auth/alterar-senha").hasAnyRole(TODOS_PERFIS)

                        /*
                         * Em produção pública, deixe Swagger protegido.
                         * Para liberar em DEV/TQS, ajuste temporariamente para permitAll()
                         * ou use um profile específico.
                         */
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").hasRole("ADMIN")
                        .requestMatchers("/api/usuarios-sistema/**").hasRole("ADMIN")

                        /*
                         * Leitura:
                         * ADMIN, OPERADOR_ADMIN, OPERADOR_LEITURA e SOMENTE_LEITURA.
                         */
                        .requestMatchers(HttpMethod.GET, "/api/**").hasAnyRole(TODOS_PERFIS)

                        /*
                         * Escrita/operação:
                         * ADMIN e OPERADOR_ADMIN.
                         */
                        .requestMatchers("/api/**").hasAnyRole(PERFIS_ESCRITA)

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
