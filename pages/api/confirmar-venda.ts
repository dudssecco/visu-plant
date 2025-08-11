import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { numero, nome, telefone, email, consultor } = req.body;

      // Validar campos obrigatórios
      if (!numero || !nome || !telefone || !email || !consultor) {
        return res.status(400).json({ 
          error: 'Todos os campos são obrigatórios' 
        });
      }

      // Confirmar a venda
      const sucesso = await db.confirmarVenda(numero, {
        nome,
        telefone,
        email,
        consultor
      });

      if (sucesso) {
        res.status(200).json({ 
          success: true, 
          message: 'Venda confirmada com sucesso',
          numero 
        });
      } else {
        res.status(409).json({ 
          error: 'Apartamento não está disponível para confirmação. Pode ter sido vendido para outro cliente.' 
        });
      }
    } catch (error) {
      console.error('Erro ao confirmar venda:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} não permitido`);
  }
}