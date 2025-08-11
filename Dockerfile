# Multi-stage build para otimizar o tamanho da imagem final

# Stage 1: Build
FROM node:18-alpine AS builder

# Instalar dependências do sistema necessárias para build
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar todas as dependências
RUN npm ci

# Copiar código da aplicação
COPY . .

# Build da aplicação Next.js
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine AS runtime

# Instalar apenas dependências de runtime
RUN apk add --no-cache \
    postgresql-client \
    dumb-init

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json para instalar apenas dependências de produção
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar arquivos necessários do stage de build
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/server.js ./server.js
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js

# Criar diretório para dados se não existir
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Mudar para usuário não-root
USER nextjs

# Expor a porta
EXPOSE 9000

# Usar dumb-init para manejo correto de sinais
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar a aplicação
CMD ["npm", "start"]