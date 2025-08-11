# VisuPlant - Sistema de Vendas em Tempo Real

## 📋 Descrição

Sistema de vendas de apartamentos em tempo real que permite:

- **Visualização em tempo real** do status dos apartamentos (Disponível/Em Negociação/Vendido)
- **QR Codes** para acesso rápido ao formulário de compra
- **Atualizações instantâneas** via WebSockets
- **Proteção contra dupla venda** do mesmo apartamento

## 🎨 Funcionalidades

### Página Principal
- Grid de cards mostrando todos os apartamentos (301-340)
- Cores indicativas do status:
  - 🟢 **Verde**: Disponível
  - 🟡 **Amarelo**: Em Negociação
  - 🔴 **Vermelho**: Vendido
- QR Code em cada apartamento disponível
- Atualizações em tempo real sem refresh da página

### Formulário de Compra
- Seleção de apartamento disponível
- Campos obrigatórios: Nome, Telefone, Email, Consultor
- Reserva automática ao selecionar apartamento
- Validação contra dupla venda
- Confirmação instantânea

### Sistema de Tempo Real
- WebSockets para comunicação instantânea
- Mudança de status automática:
  1. **Seleção no formulário** → Apartamento fica amarelo
  2. **Envio do formulário** → Apartamento fica vermelho
- Proteção: se 2 pessoas tentam comprar o mesmo apartamento, apenas a primeira consegue

## 🚀 Como Executar

### 1. Instalar Dependências
```bash
npm install
```

### 2. Executar o Servidor
```bash
npm run dev
```

### 3. Acessar o Sistema
- **Página Principal**: http://localhost:3000
- **Formulário**: http://localhost:3000/formulario

## 🏗️ Arquitetura

### Backend
- **Next.js API Routes** para endpoints REST
- **Socket.IO** para WebSockets
- **SQLite** com better-sqlite3 para banco de dados
- **Servidor customizado** (server.js) para integração WebSocket

### Frontend
- **React/Next.js** para interface
- **Tailwind CSS** para estilização
- **QRCode** para geração de códigos QR
- **Socket.IO Client** para tempo real

### Banco de Dados
```sql
apartamentos (
  id: INTEGER PRIMARY KEY,
  numero: TEXT UNIQUE,
  status: 'disponivel' | 'negociacao' | 'vendido',
  cliente_nome: TEXT,
  cliente_telefone: TEXT,
  cliente_email: TEXT,
  consultor_nome: TEXT,
  created_at: DATETIME,
  updated_at: DATETIME
)
```

## 📱 Fluxo de Uso

1. **Cliente acessa a página principal**
   - Vê todos os apartamentos com status atual
   - Apartamentos disponíveis mostram QR Code

2. **Cliente escaneia QR Code ou acessa formulário**
   - É direcionado para `/formulario?apartamento=XXX`
   - Apartamento é pré-selecionado se veio via QR

3. **Cliente seleciona apartamento no formulário**
   - Sistema reserva o apartamento (status → 'negociacao')
   - Todos os usuários veem mudança para amarelo em tempo real

4. **Cliente preenche dados e envia formulário**
   - Sistema confirma venda (status → 'vendido')
   - Apartamento fica vermelho para todos os usuários
   - Cliente recebe confirmação

5. **Proteção contra dupla venda**
   - Se outro cliente tentar comprar o mesmo apartamento, recebe erro
   - Apenas o primeiro a confirmar consegue finalizar

## 🛠️ Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Gera build de produção
- `npm start` - Executa build de produção
- `npm run lint` - Executa linter

## 📦 Dependências Principais

- **next**: Framework React
- **socket.io**: WebSockets para tempo real
- **better-sqlite3**: Banco de dados SQLite
- **qrcode**: Geração de QR Codes
- **tailwindcss**: Framework CSS

## 🔧 Configuração

O sistema funciona out-of-the-box após `npm install` e `npm run dev`. O banco de dados SQLite é criado automaticamente com os apartamentos 301-340.

## 📞 Suporte

Sistema desenvolvido para gerenciamento de vendas em tempo real com interface moderna e responsiva.