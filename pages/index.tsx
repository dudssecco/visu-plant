import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import QRCode from 'qrcode';
import { Apartamento } from '@/lib/database';

export default function Home() {
  const [apartamentos, setApartamentos] = useState<Apartamento[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeGeral, setQrCodeGeral] = useState<string>('');
  const [filaCounts, setFilaCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Conectar ao WebSocket
    const socketInstance = io();
    setSocket(socketInstance);

    // Buscar apartamentos e filas iniciais
    fetchApartamentos();
    fetchFilaCounts();

    // Escutar eventos do WebSocket
    socketInstance.on('apartamento-reservado', (numero: string) => {
      setApartamentos(prev => 
        prev.map(apt => 
          apt.numero === numero 
            ? { ...apt, status: 'negociacao' as const }
            : apt
        )
      );
    });

    socketInstance.on('apartamento-vendido', (data: { numero: string }) => {
      setApartamentos(prev =>
        prev.map(apt =>
          apt.numero === data.numero
            ? { ...apt, status: 'reservado' as const }
            : apt
        )
      );
    });

    socketInstance.on('apartamento-liberado', (numero: string) => {
      console.log('🟢 Evento recebido: apartamento-liberado', numero);
      setApartamentos(prev =>
        prev.map(apt =>
          apt.numero === numero
            ? { ...apt, status: 'disponivel' as const }
            : apt
        )
      );
      // Recarregar apartamentos do banco para garantir sincronização
      fetchApartamentos();
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const fetchApartamentos = async () => {
    try {
      const response = await fetch('/api/apartamentos');
      const data = await response.json();
      
      setApartamentos(data);
      
      // Gerar QR code geral para o formulário
      const qrCodeUrl = `${window.location.origin}/formulario`;
      const qrCode = await QRCode.toDataURL(qrCodeUrl);
      setQrCodeGeral(qrCode);
    } catch (error) {
      console.error('Erro ao buscar apartamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilaCounts = async () => {
    try {
      const response = await fetch('/api/listar-filas');
      const data = await response.json();

      const counts: Record<string, number> = {};
      Object.entries(data.filasPorApartamento).forEach(([numero, fila]) => {
        counts[numero] = (fila as any[]).length;
      });
      setFilaCounts(counts);
    } catch (error) {
      console.error('Erro ao buscar contagem de filas:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'bg-gradient-to-br from-green-400 to-green-600 shadow-green-200';
      case 'negociacao':
        return 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-yellow-200';
      case 'reservado':
        return 'bg-gradient-to-br from-red-400 to-red-600 shadow-red-200';
      case 'vendido':
        return 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-200';
      default:
        return 'bg-gradient-to-br from-gray-400 to-gray-600 shadow-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'Disponível';
      case 'negociacao':
        return 'Em Negociação';
      case 'reservado':
        return 'Reservado';
      case 'vendido':
        return 'Vendido';
      default:
        return 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Carregando apartamentos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header com gradiente e ícone */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6 shadow-xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Studios
          </h1>
          <p className="text-xl text-gray-600 font-medium">Sistema de Reservas em Tempo Real</p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto mt-4 rounded-full"></div>
        </div>
        
        {/* QR Code Geral */}
        {qrCodeGeral && (
          <div className="flex justify-center mb-12">
            <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-200 text-center max-w-sm backdrop-blur-sm">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12V8m0 4h-4.01M12 12v4"></path>
                </svg>
                <h2 className="text-xl font-bold text-gray-800">
                  Acesso Rápido
                </h2>
              </div>
              <p className="text-gray-600 mb-6 text-sm">
                Escaneie o código QR para acessar o formulário de reserva
              </p>
              <div className="relative">
                <img 
                  src={qrCodeGeral} 
                  alt="QR Code para formulário de reserva"
                  className="mx-auto w-40 h-40 mb-4 rounded-lg shadow-md"
                />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-sm text-gray-500 mr-2">Ou acesse:</span>
                <a href="/formulario" className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline transition-colors">
                  /formulario
                </a>
              </div>
            </div>
          </div>
        )}
        
        {/* Legenda */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 px-8 py-6">
            <h3 className="text-lg font-semibold text-gray-800 text-center mb-4">Status dos Apartamentos</h3>
            <div className="flex justify-center gap-8">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-green-600 rounded-full shadow-md group-hover:scale-110 transition-transform"></div>
                <span className="text-gray-700 font-medium">Disponível</span>
              </div>
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-md group-hover:scale-110 transition-transform"></div>
                <span className="text-gray-700 font-medium">Em Negociação</span>
              </div>
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-5 h-5 bg-gradient-to-r from-red-400 to-red-600 rounded-full shadow-md group-hover:scale-110 transition-transform"></div>
                <span className="text-gray-700 font-medium">Reservado</span>
              </div>
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-5 h-5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-md group-hover:scale-110 transition-transform"></div>
                <span className="text-gray-700 font-medium">Vendido</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de apartamentos */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-4 px-4">
          {apartamentos.map((apartamento) => (
            <div
              key={apartamento.id}
              className={`${getStatusColor(apartamento.status)} rounded-xl shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-2xl aspect-square flex items-center justify-center cursor-pointer relative overflow-hidden group`}
            >
              {/* Efeito de brilho no hover */}
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Número do apartamento */}
              <div className="text-center relative z-10">
                <h2 className="text-white font-bold text-lg drop-shadow-lg">
                  {apartamento.numero}
                </h2>
              </div>

              {/* Efeito de borda brilhante */}
              <div className="absolute inset-0 rounded-xl border-2 border-white/30 group-hover:border-white/60 transition-all duration-300"></div>
            </div>
          ))}
        </div>

        {/* Informações adicionais */}
        <div className="mt-16 mb-8">
          <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 mx-4">
            <h3 className="text-2xl font-bold text-gray-800 text-center mb-8">Resumo do Empreendimento</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Total */}
              <div className="text-center group">
                <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl p-6 shadow-lg group-hover:shadow-xl transition-shadow">
                  <div className="text-white">
                    <svg className="w-8 h-8 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    <div className="text-3xl font-bold mb-1">{apartamentos.length}</div>
                    <div className="text-sm opacity-90">Total</div>
                  </div>
                </div>
              </div>

              {/* Disponíveis */}
              <div className="text-center group">
                <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-2xl p-6 shadow-lg group-hover:shadow-xl transition-shadow">
                  <div className="text-white">
                    <svg className="w-8 h-8 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div className="text-3xl font-bold mb-1">{apartamentos.filter(a => a.status === 'disponivel').length}</div>
                    <div className="text-sm opacity-90">Disponíveis</div>
                  </div>
                </div>
              </div>

              {/* Em Negociação */}
              <div className="text-center group">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 shadow-lg group-hover:shadow-xl transition-shadow">
                  <div className="text-white">
                    <svg className="w-8 h-8 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div className="text-3xl font-bold mb-1">{apartamentos.filter(a => a.status === 'negociacao').length}</div>
                    <div className="text-sm opacity-90">Em Negociação</div>
                  </div>
                </div>
              </div>

              {/* Reservados */}
              <div className="text-center group">
                <div className="bg-gradient-to-r from-red-400 to-red-600 rounded-2xl p-6 shadow-lg group-hover:shadow-xl transition-shadow">
                  <div className="text-white">
                    <svg className="w-8 h-8 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div className="text-3xl font-bold mb-1">{apartamentos.filter(a => a.status === 'reservado').length}</div>
                    <div className="text-sm opacity-90">Reservados</div>
                  </div>
                </div>
              </div>

              {/* Vendidos */}
              <div className="text-center group">
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl p-6 shadow-lg group-hover:shadow-xl transition-shadow">
                  <div className="text-white">
                    <svg className="w-8 h-8 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <div className="text-3xl font-bold mb-1">{apartamentos.filter(a => a.status === 'vendido').length}</div>
                    <div className="text-sm opacity-90">Vendidos</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="mt-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progresso de Vendas</span>
                <span>{Math.round((apartamentos.filter(a => a.status === 'reservado' || a.status === 'vendido').length / apartamentos.length) * 100)}% vendido</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-1000 shadow-md"
                  style={{ width: `${(apartamentos.filter(a => a.status === 'reservado' || a.status === 'vendido').length / apartamentos.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}