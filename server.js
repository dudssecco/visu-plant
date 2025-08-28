const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 9000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Mapa para controlar timeouts dos apartamentos
  const apartamentoTimeouts = new Map();

  // Gerenciar conexões WebSocket
  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    // Quando cliente seleciona apartamento (muda para amarelo)
    socket.on('reservar-apartamento', (numero) => {
      console.log('Reservando apartamento:', numero);
      
      // Cancelar timeout anterior se existir
      if (apartamentoTimeouts.has(numero)) {
        clearTimeout(apartamentoTimeouts.get(numero));
      }

      // Criar timeout de 120 segundos
      const timeoutId = setTimeout(() => {
        console.log('Timeout: Liberando apartamento', numero);
        // Liberar apartamento no backend
        fetch(`http://localhost:${port}/api/liberar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ numero })
        }).then(() => {
          // Broadcast para todos os clientes
          io.emit('apartamento-liberado', numero);
          apartamentoTimeouts.delete(numero);
        }).catch(console.error);
      }, 120000); // 120 segundos

      apartamentoTimeouts.set(numero, timeoutId);
      
      // Broadcast para todos os clientes
      io.emit('apartamento-reservado', numero);
    });

    // Quando cliente confirma compra (muda para vermelho)
    socket.on('confirmar-venda', (data) => {
      console.log('Confirmando venda:', data);
      
      // Cancelar timeout já que a venda foi confirmada
      if (apartamentoTimeouts.has(data.numero)) {
        clearTimeout(apartamentoTimeouts.get(data.numero));
        apartamentoTimeouts.delete(data.numero);
      }
      
      // Broadcast para todos os clientes
      io.emit('apartamento-vendido', data);
    });

    // Fluxo: entrar em negociação (amarelo) e permanecer assim (sem venda automática)
    socket.on('negociar-e-vender', (numero) => {
      console.log('Negociar (sem auto-venda):', numero);

      // Cancelar timeout anterior se existir e não agendar novo
      if (apartamentoTimeouts.has(numero)) {
        clearTimeout(apartamentoTimeouts.get(numero));
        apartamentoTimeouts.delete(numero);
      }

      // Emite imediatamente que entrou em negociação (amarelo)
      io.emit('apartamento-reservado', numero);
    });

    // Quando precisa liberar apartamento (volta para verde)
    socket.on('liberar-apartamento', (numero) => {
      console.log('Liberando apartamento:', numero);
      
      // Cancelar timeout se existir
      if (apartamentoTimeouts.has(numero)) {
        clearTimeout(apartamentoTimeouts.get(numero));
        apartamentoTimeouts.delete(numero);
      }
      
      // Broadcast para todos os clientes
      io.emit('apartamento-liberado', numero);
    });

    // Atualização geral do status
    socket.on('atualizar-status', (data) => {
      console.log('Atualizando status:', data);
      io.emit('status-atualizado', data);
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Servidor rodando em http://${hostname}:${port}`);
    });
});