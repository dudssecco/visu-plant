# Use a imagem oficial do Node.js 18
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema necessárias para better-sqlite3 e outras
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    sqlite-dev

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código da aplicação
COPY . .

# Criar diretório para dados se não existir
RUN mkdir -p /app/data

# Build da aplicação Next.js
RUN npm run build

# Expor a porta
EXPOSE 9000

# Comando para iniciar a aplicação
CMD ["npm", "start"]