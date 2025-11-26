import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { io, Socket } from 'socket.io-client';
import { Apartamento } from '@/lib/database';

declare global {
  interface Window {
    countdownInterval?: NodeJS.Timeout;
  }
}

export default function FormularioMultiplo() {
  const router = useRouter();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [apartamentos, setApartamentos] = useState<Apartamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apartamentosSelecionados, setApartamentosSelecionados] = useState<string[]>([]);
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Sem formulário de dados pessoais nesta página

  // Unidades especiais: somente estas devem aparecer nesta página (apartamentos já reservados)
  const unidadesEspeciais = new Set(['L02', '207', '208', '209', '211', '213', '214', '215', '306', '307', '309']);

  useEffect(() => {
    // Conectar ao WebSocket
    const socketInstance = io();
    setSocket(socketInstance);

    // Buscar apartamentos disponíveis
    fetchApartamentos();

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
      setApartamentos(prev => 
        prev.map(apt => 
          apt.numero === numero 
            ? { ...apt, status: 'disponivel' as const }
            : apt
        )
      );
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
    } catch (error) {
      console.error('Erro ao buscar apartamentos:', error);
      setError('Erro ao carregar apartamentos disponíveis');
    } finally {
      setLoading(false);
    }
  };

  // Removidos handlers de inputs

  const handleApartamentoToggle = async (numeroApartamento: string) => {
    setError('');

    // Atualiza estado local para reservado INSTANTANEAMENTE (sensação de escassez)
    setApartamentos(prev => prev.map(apt => (
      apt.numero === numeroApartamento ? { ...apt, status: 'reservado' as const } : apt
    )));

    try {
      // Chamar API para marcar como reservado no backend
      const response = await fetch('/api/atualizar-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: numeroApartamento,
          status: 'reservado'
        })
      });

      if (!response.ok) {
        // Se falhar, reverter o status localmente
        setApartamentos(prev => prev.map(apt => (
          apt.numero === numeroApartamento ? { ...apt, status: 'disponivel' as const } : apt
        )));
        setError('Erro ao atualizar status do apartamento');
        return;
      }

      // Notificar via WebSocket que o apartamento foi reservado
      // Envia para o servidor que faz broadcast para todos os clientes
      if (socket) {
        socket.emit('confirmar-venda', { numero: numeroApartamento });
      }

      setSuccess(`Apartamento ${numeroApartamento} reservado!`);
    } catch (error) {
      console.error('Erro ao reservar apartamento:', error);
      // Reverter status em caso de erro
      setApartamentos(prev => prev.map(apt => (
        apt.numero === numeroApartamento ? { ...apt, status: 'disponivel' as const } : apt
      )));
      setError('Erro ao processar reserva');
    }
  };

  const handleSelectAll = async () => {
    // Selecionar apenas os disponíveis dentre as unidades especiais
    const apartamentosDisponiveis = apartamentos
      .filter(apt => unidadesEspeciais.has(apt.numero) && apt.status === 'disponivel')
      .map(apt => apt.numero);
    
    if (apartamentosDisponiveis.length === 0) {
      setError('Nenhum apartamento disponível para seleção');
      return;
    }

    try {
      const response = await fetch('/api/reservar-multiplo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apartamentos: apartamentosDisponiveis })
      });

      const data = await response.json();

      if (response.ok) {
        // Notificar via WebSocket que os apartamentos foram reservados
        if (socket) {
          apartamentosDisponiveis.forEach(numero => {
            socket.emit('reservar-apartamento', numero);
          });
        }
        
        setApartamentosSelecionados(apartamentosDisponiveis);
        
        // Iniciar countdown de 60 segundos
        setTimeoutWarning(true);
        setCountdown(60);
        
        // Limpar countdown anterior se existir
        if (window.countdownInterval) {
          clearInterval(window.countdownInterval);
        }
        
        window.countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(window.countdownInterval);
              setTimeoutWarning(false);
              setError('Tempo esgotado! Os apartamentos foram liberados. Selecione novamente.');
              setApartamentosSelecionados([]);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
      } else {
        setError(data.error || 'Alguns apartamentos não estão mais disponíveis');
      }
    } catch (error) {
      console.error('Erro ao reservar todos os apartamentos:', error);
      setError('Erro ao reservar apartamentos');
    }
  };

  const handleDeselectAll = async () => {
    if (apartamentosSelecionados.length === 0) return;

    try {
      // Liberar todos os apartamentos selecionados
      const liberarPromises = apartamentosSelecionados.map(numero => 
        fetch('/api/liberar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ numero })
        })
      );

      await Promise.all(liberarPromises);

      if (socket) {
        apartamentosSelecionados.forEach(numero => {
          socket.emit('liberar-apartamento', numero);
        });
      }

      setApartamentosSelecionados([]);
      setTimeoutWarning(false);
      setCountdown(0);
      
      if (window.countdownInterval) {
        clearInterval(window.countdownInterval);
      }
    } catch (error) {
      console.error('Erro ao liberar apartamentos:', error);
      setError('Erro ao liberar apartamentos');
    }
  };

  // Sem submit – ação é no clique do apartamento

  // Filtrar apenas as unidades especiais para exibição
  const apartamentosEspeciais = apartamentos.filter(apt => unidadesEspeciais.has(apt.numero));
  const apartamentosDisponiveis = apartamentosEspeciais.filter(apt => apt.status === 'disponivel');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Carregando formulário...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Formulário de Reserva Múltipla
          </h1>
          <p className="text-gray-600">Selecione múltiplos apartamentos e complete seus dados</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 text-red-800 px-4 py-3 rounded-r-lg mb-6 shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
              </svg>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 text-green-800 px-4 py-3 rounded-r-lg mb-6 shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              <div>
                {success}
                <p className="text-sm mt-1 text-green-600">Redirecionando para a página principal...</p>
              </div>
            </div>
          </div>
        )}

        {/* Temporizador removido nesta página */}

        <div className="space-y-8">
          {/* Seção de apartamentos */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                Selecionar Apartamentos
              </h2>
              
              <div className="flex gap-2" />
            </div>

            {/* Painel de selecionados removido */}

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
              {apartamentosEspeciais.map((apartamento) => {
                const isDisponivel = apartamento.status === 'disponivel';
                const isSelecionado = false;
                
                return (
                  <div
                    key={apartamento.id}
                    className={`
                      aspect-square rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all duration-200 relative
                      ${!isDisponivel 
                        ? 'bg-gray-200 border-gray-300 cursor-not-allowed opacity-50' 
                        : isSelecionado
                        ? 'bg-blue-500 border-blue-600 text-white shadow-lg transform scale-105'
                        : 'bg-white border-gray-300 hover:border-blue-400 hover:shadow-md hover:scale-105'
                      }
                    `}
                    onClick={() => isDisponivel && handleApartamentoToggle(apartamento.numero)}
                  >
                    <span className={`font-bold text-sm ${isSelecionado ? 'text-white' : 'text-gray-800'}`}>
                      {apartamento.numero}
                    </span>
                    
                    {isSelecionado && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    )}
                    
                    {!isDisponivel && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
                  <span className="text-gray-600">Disponível</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-gray-600">Vendido</span>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600 mt-4">
              {apartamentosDisponiveis.length} apartamentos disponíveis para seleção
            </p>
          </div>
        </div>

        {/* Link de volta */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Voltar para a página principal
          </button>
        </div>
      </div>
    </div>
  );
}
