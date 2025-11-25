import { NextApiRequest, NextApiResponse } from 'next';
import { db, validarCPF } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { apartamentos, nome, telefone, email, cpf, consultor } = req.body;

      // Validar campos obrigatórios
      if (!apartamentos || !Array.isArray(apartamentos) || apartamentos.length === 0) {
        return res.status(400).json({ 
          error: 'Pelo menos um apartamento deve ser selecionado' 
        });
      }

      if (!nome || !telefone || !email || !cpf || !consultor) {
        return res.status(400).json({ 
          error: 'Todos os campos são obrigatórios' 
        });
      }

      // Validar CPF
      if (!validarCPF(cpf)) {
        return res.status(400).json({ error: 'CPF inválido. Verifique os números digitados.' });
      }

      // Verificar limite de apartamentos por CPF
      const { valido, apartamentosAtivos } = await db.verificarLimiteCPF(cpf);
      const totalApartamentos = apartamentosAtivos + apartamentos.length;
      
      if (totalApartamentos > 2) {
        return res.status(409).json({ 
          error: `Este CPF já possui ${apartamentosAtivos} apartamento(s). Você está tentando comprar mais ${apartamentos.length}. Máximo permitido: 2 apartamentos por CPF.` 
        });
      }

      // Primeiro, reservar todos os apartamentos
      const reservaPromises = apartamentos.map(numero => 
        db.reservarApartamento(numero)
      );
      const reservaResults = await Promise.all(reservaPromises);

      // Verificar quais apartamentos não puderam ser reservados
      const apartamentosNaoReservados = apartamentos.filter((_, index) => !reservaResults[index]);

      if (apartamentosNaoReservados.length > 0) {
        // Liberar os apartamentos que foram reservados com sucesso
        const apartamentosReservados = apartamentos.filter((_, index) => reservaResults[index]);
        await Promise.all(apartamentosReservados.map(numero => 
          db.liberarApartamento(numero)
        ));

        return res.status(409).json({ 
          error: `Os seguintes apartamentos não estão mais disponíveis: ${apartamentosNaoReservados.join(', ')}` 
        });
      }

      // Se chegou até aqui, todos os apartamentos foram reservados
      // Agora confirmar a venda de todos
      const vendaPromises = apartamentos.map(numero => 
        db.confirmarVenda(numero, {
          nome,
          telefone,
          email,
          cpf,
          consultor
        })
      );
      const vendaResults = await Promise.all(vendaPromises);

      // Verificar se todas as vendas foram confirmadas
      const todasVendasConfirmadas = vendaResults.every(result => result);

      if (todasVendasConfirmadas) {
        res.status(200).json({ 
          success: true, 
          message: `Vendas confirmadas com sucesso para ${apartamentos.length} apartamento(s)`,
          apartamentos: apartamentos
        });
      } else {
        // Se alguma venda falhou, liberar todos os apartamentos
        await Promise.all(apartamentos.map(numero => 
          db.liberarApartamento(numero)
        ));

        res.status(500).json({ 
          error: 'Erro ao processar algumas vendas. Todos os apartamentos foram liberados.' 
        });
      }
    } catch (error) {
      console.error('Erro ao confirmar vendas múltiplas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} não permitido`);
  }
}
