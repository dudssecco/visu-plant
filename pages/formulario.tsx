import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { io, Socket } from 'socket.io-client';
import { Apartamento, validarCPF, formatarCPF } from '@/lib/database';

export default function Formulario() {
  const router = useRouter();
  const { apartamento: apartamentoPreSelecionado } = router.query;
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [apartamentos, setApartamentos] = useState<Apartamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    cpf: '',
    consultor: '',
    apartamento: apartamentoPreSelecionado as string || ''
  });

  useEffect(() => {
    // Conectar ao WebSocket
    const socketInstance = io();
    setSocket(socketInstance);

    // Buscar apartamentos disponíveis
    fetchApartamentos();

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (apartamentoPreSelecionado) {
      setFormData(prev => ({ ...prev, apartamento: apartamentoPreSelecionado as string }));
    }
  }, [apartamentoPreSelecionado]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cpf') {
      // Formatar CPF em tempo real
      const cpfLimpo = value.replace(/[^\d]/g, '');
      const cpfFormatado = cpfLimpo.length <= 11 ? formatarCPF(cpfLimpo) : formData.cpf;
      setFormData(prev => ({ ...prev, [name]: cpfFormatado }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    setError('');
  };

  const handleApartamentoSelect = async (numeroApartamento: string) => {
    if (!numeroApartamento) {
      // Se deselecionar, cancelar countdown
      setTimeoutWarning(false);
      setCountdown(0);
      return;
    }

    // Verificar se o apartamento ainda está disponível e reservá-lo
    try {
      const response = await fetch('/api/reservar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ numero: numeroApartamento })
      });

      const data = await response.json();

      if (response.ok) {
        // Notificar via WebSocket que o apartamento foi reservado
        if (socket) {
          socket.emit('reservar-apartamento', numeroApartamento);
        }
        setFormData(prev => ({ ...prev, apartamento: numeroApartamento }));
        
        // Iniciar countdown de 120 segundos
        setTimeoutWarning(true);
        setCountdown(120);
        
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              setTimeoutWarning(false);
              setError('Tempo esgotado! O apartamento foi liberado. Selecione novamente.');
              setFormData(prev => ({ ...prev, apartamento: '' }));
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
      } else {
        setError(data.error || 'Apartamento não está mais disponível');
        setFormData(prev => ({ ...prev, apartamento: '' }));
      }
    } catch (error) {
      console.error('Erro ao reservar apartamento:', error);
      setError('Erro ao reservar apartamento');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Validação básica
    if (!formData.nome || !formData.telefone || !formData.email || !formData.cpf || !formData.consultor || !formData.apartamento) {
      setError('Todos os campos são obrigatórios');
      setSubmitting(false);
      return;
    }

    // Validação do CPF
    if (!validarCPF(formData.cpf)) {
      setError('CPF inválido. Verifique os números digitados.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/confirmar-venda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          numero: formData.apartamento,
          nome: formData.nome,
          telefone: formData.telefone,
          email: formData.email,
          cpf: formData.cpf,
          consultor: formData.consultor
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Cancelar countdown já que a venda foi confirmada
        setTimeoutWarning(false);
        setCountdown(0);
        
        // Notificar via WebSocket que a venda foi confirmada
        if (socket) {
          socket.emit('confirmar-venda', { numero: formData.apartamento });
        }

        setSuccess(`Parabéns! Reserva do apartamento ${formData.apartamento} confirmada com sucesso!`);
        
        // Limpar formulário
        setFormData({
          nome: '',
          telefone: '',
          email: '',
          cpf: '',
          consultor: '',
          apartamento: ''
        });

        // Redirecionar após 3 segundos
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setError(data.error || 'Erro ao confirmar a reserva');
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      setError('Erro ao processar sua solicitação');
    } finally {
      setSubmitting(false);
    }
  };

  const apartamentosDisponiveis = apartamentos.filter(apt => apt.status === 'disponivel');
  const unidadesBloqueadas = new Set(['101', '102', '103', '104', '109', '110', '204', '210', '403', '405']);
  const apartamentosSelecionaveis = apartamentosDisponiveis.filter(apt => !unidadesBloqueadas.has(apt.numero));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Carregando formulário...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Formulário de Reserva
          </h1>
          <p className="text-gray-600">Complete seus dados para confirmar a reserva</p>
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
                <span className="font-medium">Apartamento reservado! Complete em:</span>
              </div>
              <span className="font-bold text-xl text-amber-600">{countdown}s</span>
            </div>
            <div className="w-full bg-amber-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all duração-1000" 
                style={{ width: `${(countdown / 120) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Apartamento */}
          <div className="group">
            <label htmlFor="apartamento" className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
              Apartamento *
            </label>
            <select
              id="apartamento"
              name="apartamento"
              value={formData.apartamento}
              onChange={(e) => {
                handleInputChange(e);
                handleApartamentoSelect(e.target.value);
              }}
              required
              className="w-full px-4 py-3 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 appearance-none cursor-pointer"
            >
              <option value="" className="text-gray-500">Selecione um apartamento disponível</option>
              {apartamentosSelecionaveis.map((apt) => (
                <option key={apt.id} value={apt.numero} className="text-gray-900">
                  {apt.numero === 'L01' ? 'Loja L01' : `Apartamento ${apt.numero}`}
                </option>
              ))}
            </select>
            <div className="flex items-center mt-2">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <p className="text-sm text-gray-600">
                {apartamentosSelecionaveis.length} apartamentos disponíveis
              </p>
            </div>
          </div>
          {/* Nome */}
          <div className="group">
            <label htmlFor="nome" className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              Nome Completo *
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
              placeholder="Digite seu nome completo"
            />
          </div>

          {/* Telefone */}
          <div className="group">
            <label htmlFor="telefone" className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              Telefone *
            </label>
            <input
              type="tel"
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
              placeholder="(11) 99999-9999"
            />
          </div>

          {/* Email */}
          <div className="group">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
              placeholder="seu@email.com"
            />
          </div>

          {/* CPF */}
          <div className="group">
            <label htmlFor="cpf" className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path>
              </svg>
              CPF *
            </label>
            <input
              type="text"
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={handleInputChange}
              required
              maxLength={14}
              className="w-full px-4 py-3 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
              placeholder="000.000.000-00"
            />
          </div>

          {/* Consultor */}
          <div className="group">
            <label htmlFor="consultor" className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 00-2 2H10a2 2 0 00-2-2V6m8 0h2a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h2"></path>
              </svg>
              Nome do Consultor *
            </label>
            <input
              type="text"
              id="consultor"
              name="consultor"
              value={formData.consultor}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
              placeholder="Nome do consultor responsável"
            />
          </div>


          {/* Botão de envio */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting || success !== ''}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100 flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Confirmando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Confirmar Reserva
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