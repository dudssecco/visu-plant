# Guia de Deploy - VisuPlant

Este guia explica como fazer deploy da aplicação VisuPlant usando Docker e Docker Compose.

## Pré-requisitos

- Docker
- Docker Compose
- Servidor com pelo menos 2GB de RAM
- Portas 80, 443, 9000 e 5432 disponíveis

## Configuração Inicial

### 1. Clonar o repositório

```bash
git clone <seu-repositorio>
cd VisuPlant
```

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo e configure suas variáveis:

```bash
cp env.production .env
```

**IMPORTANTE**: Altere as senhas padrão no arquivo `.env`:

```env
POSTGRES_PASSWORD=sua_senha_forte_aqui
DATABASE_URL=postgresql://visuplant_user:sua_senha_forte_aqui@database:5432/visuplant
```

### 3. Configurar SSL (Opcional, mas recomendado)

Para HTTPS, coloque seus certificados SSL na pasta `ssl/`:

```bash
mkdir ssl
# Copie seus arquivos cert.pem e key.pem para a pasta ssl/
```

Depois descomente a seção HTTPS no arquivo `nginx.conf`.

## Deploy

### Primeira vez

```bash
# Build e start dos containers
docker-compose up -d --build

# Verificar se os containers estão rodando
docker-compose ps

# Verificar logs
docker-compose logs -f
```

### Atualizações

```bash
# Parar os containers
docker-compose down

# Rebuild e restart
docker-compose up -d --build
```

## Verificação

1. Acesse `http://seu-servidor` para ver a aplicação
2. Verifique se o banco de dados foi inicializado corretamente:

```bash
# Conectar ao PostgreSQL
docker-compose exec database psql -U visuplant_user -d visuplant

# Verificar se as tabelas foram criadas
\dt

# Verificar dados iniciais
SELECT count(*) FROM apartamentos;

# Sair
\q
```

## Backup e Restauração

### Backup do banco de dados

```bash
# Criar backup
docker-compose exec database pg_dump -U visuplant_user visuplant > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar backup

```bash
# Restaurar backup
docker-compose exec -T database psql -U visuplant_user visuplant < backup_arquivo.sql
```

## Monitoramento

### Logs

```bash
# Ver logs da aplicação
docker-compose logs -f app

# Ver logs do banco
docker-compose logs -f database

# Ver logs do nginx
docker-compose logs -f nginx
```

### Status dos containers

```bash
docker-compose ps
```

### Uso de recursos

```bash
docker stats
```

## Resolução de Problemas

### Container não inicia

```bash
# Verificar logs detalhados
docker-compose logs [nome-do-servico]

# Verificar configuração
docker-compose config
```

### Problema de conectividade com banco

```bash
# Testar conexão com o banco
docker-compose exec app ping database

# Verificar se o banco está aceitando conexões
docker-compose exec database pg_isready -U visuplant_user
```

### Reset completo

```bash
# Parar e remover containers, networks e volumes
docker-compose down -v

# Rebuild completo
docker-compose up -d --build
```

## Configurações de Produção

### Firewall

Configure seu firewall para permitir apenas as portas necessárias:

```bash
# Apenas HTTP/HTTPS
ufw allow 80
ufw allow 443

# Se precisar acessar diretamente a aplicação
ufw allow 9000

# PostgreSQL (apenas se precisar de acesso externo)
ufw allow 5432
```

### Atualizações automáticas

Considere configurar atualizações automáticas do Docker:

```bash
# Exemplo com Watchtower
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --schedule "0 0 4 * * *" \
  visuplant-app
```

## Suporte

Para problemas ou dúvidas:

1. Verifique os logs primeiro
2. Consulte a documentação do Docker
3. Entre em contato com a equipe de desenvolvimento