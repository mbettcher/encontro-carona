# Checklist 2.18D — Hardening básico da VPS

## Segurança de acesso
- [ ] Tenho um usuário operacional que não seja root.
- [ ] Usuário operacional está no grupo docker, se for executar Docker sem sudo.
- [ ] Login SSH testado em sessão nova antes de mexer no sshd.
- [ ] UFW ativo.
- [ ] Portas públicas limitadas a 22, 80 e 443.
- [ ] Fail2ban instalado e jail sshd ativa.

## Aplicação
- [ ] `.env` com permissão 600.
- [ ] Backups em `/opt/backups/tio-carona/postgres` com permissão restrita.
- [ ] Scripts operacionais com permissão de execução.
- [ ] `docker ps` mostra proxy, frontend, backend e postgres saudáveis.

## Certificados
- [ ] `https://cdm.dev.br` acessa com conexão segura.
- [ ] `sudo certbot renew --dry-run` passou.
- [ ] Hook de renovação reinicia/recarrega o proxy.

## Operação
- [ ] Backup manual testado.
- [ ] Cron de backup diário configurado.
- [ ] Script de status testado.
- [ ] Script de logs testado.
- [ ] Procedimento de restore documentado e entendido.

## Observações
Não desabilite login por senha nem root até confirmar que sua chave SSH funciona em uma nova sessão. Mantenha uma sessão atual aberta enquanto testa outra.
