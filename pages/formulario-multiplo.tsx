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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apartamentosSelecionados, setApartamentosSelecionados] = useState<string[]>([]);
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    consultor: ''
  });

  // Unidades especiais: somente estas devem aparecer nesta página
  const unidadesEspeciais = new Set(['101','102','103','104','109','110','204','210','403','405']);

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
            ? { ...apt, status: 'vendido' as const }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleApartamentoToggle = async (numeroApartamento: string) => {
    setError('');
    
    if (apartamentosSelecionados.includes(numeroApartamento)) {
      // Removendo apartamento da seleção - liberar da reserva
      try {
        await fetch('/api/liberar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ numero: numeroApartamento })
        });

        if (socket) {
          socket.emit('liberar-apartamento', numeroApartamento);
        }

        setApartamentosSelecionados(prev => prev.filter(num => num !== numeroApartamento));
      } catch (error) {
        console.error('Erro ao liberar apartamento:', error);
        setError('Erro ao liberar apartamento');
      }
    } else {
      // Adicionando apartamento à seleção - fazer reserva temporária
      const novaSeleção = [...apartamentosSelecionados, numeroApartamento];
      
      try {
        const response = await fetch('/api/reservar-multiplo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ apartamentos: novaSeleção })
        });

        const data = await response.json();

        if (response.ok) {
          // Notificar via WebSocket que os apartamentos foram reservados
          if (socket) {
            novaSeleção.forEach(numero => {
              socket.emit('reservar-apartamento', numero);
            });
          }
          
          setApartamentosSelecionados(novaSeleção);
          
          // Iniciar/reiniciar countdown de 60 segundos
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
        console.error('Erro ao reservar apartamentos:', error);
        setError('Erro ao reservar apartamentos');
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Validação básica
    if (!formData.nome || !formData.telefone || !formData.email || !formData.consultor) {
      setError('Todos os campos são obrigatórios');
      setSubmitting(false);
      return;
    }

    if (apartamentosSelecionados.length === 0) {
      setError('Selecione pelo menos um apartamento');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/confirmar-venda-multipla', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apartamentos: apartamentosSelecionados,
          nome: formData.nome,
          telefone: formData.telefone,
          email: formData.email,
          consultor: formData.consultor
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Cancelar countdown já que as vendas foram confirmadas
        setTimeoutWarning(false);
        setCountdown(0);
        if (window.countdownInterval) {
          clearInterval(window.countdownInterval);
        }
        
        // Notificar via WebSocket que as vendas foram confirmadas
        if (socket) {
          apartamentosSelecionados.forEach(numero => {
            socket.emit('confirmar-venda', { numero });
          });
        }

        setSuccess(`Parabéns! ${apartamentosSelecionados.length} apartamento(s) confirmado(s) com sucesso: ${apartamentosSelecionados.join(', ')}`);
        
        // Limpar formulário
        setFormData({
          nome: '',
          telefone: '',
          email: '',
          consultor: ''
        });
        setApartamentosSelecionados([]);

        // Redirecionar após 3 segundos
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setError(data.error || 'Erro ao confirmar as vendas');
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      setError('Erro ao processar sua solicitação');
    } finally {
      setSubmitting(false);
    }
  };

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

        {timeoutWarning && (
          <div className="bg-amber-50 border-l-4 border-amber-400 text-amber-800 px-4 py-3 rounded-r-lg mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                </svg>
                <span className="font-medium">Apartamentos reservados! Complete em:</span>
              </div>
              <span className="font-bold text-xl text-amber-600">{countdown}s</span>
            </div>
            <div className="w-full bg-amber-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all duration-1000" 
                style={{ width: `${(countdown / 60) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Seção de dados pessoais */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              Dados Pessoais
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="group">
                <label htmlFor="nome" className="block text-sm font-semibold text-gray-800 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  placeholder="Digite seu nome completo"
                />
              </div>

              {/* Telefone */}
              <div className="group">
                <label htmlFor="telefone" className="block text-sm font-semibold text-gray-800 mb-2">
                  Telefone *
                </label>
                <input
                  type="tel"
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  placeholder="(11) 99999-9999"
                />
              </div>

              {/* Email */}
              <div className="group">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  placeholder="seu@email.com"
                />
              </div>

              {/* Consultor */}
              <div className="group">
                <label htmlFor="consultor" className="block text-sm font-semibold text-gray-800 mb-2">
                  Nome do Consultor *
                </label>
                <input
                  type="text"
                  id="consultor"
                  name="consultor"
                  value={formData.consultor}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  placeholder="Nome do consultor responsável"
                />
              </div>
            </div>
          </div>

          {/* Seção de apartamentos */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                Selecionar Apartamentos ({apartamentosSelecionados.length} selecionados)
              </h2>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  Selecionar Todos
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Limpar Seleção
                </button>
              </div>
            </div>

            {apartamentosSelecionados.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  Apartamentos selecionados: {apartamentosSelecionados.sort().join(', ')}
                </p>
              </div>
            )}

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
              {apartamentosEspeciais.map((apartamento) => {
                const isDisponivel = apartamento.status === 'disponivel';
                const isSelecionado = apartamentosSelecionados.includes(apartamento.numero);
                
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
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-gray-600">Selecionado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <span className="text-gray-600">Indisponível</span>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600 mt-4">
              {apartamentosDisponiveis.length} apartamentos disponíveis para seleção
            </p>
          </div>

          {/* Botão de envio */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting || success !== '' || apartamentosSelecionados.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100 flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando {apartamentosSelecionados.length} apartamento(s)...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Confirmar Reserva de {apartamentosSelecionados.length} Apartamento(s)
                </>
              )}
            </button>
          </div>
        </form>

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
