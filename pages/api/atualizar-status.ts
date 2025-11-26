import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { numero, status } = req.body;

      if (!numero || !status) {
        return res.status(400).json({ error: 'Número e status são obrigatórios' });
      }

      // Validar status
      const statusValidos = ['disponivel', 'negociacao', 'reservado', 'vendido'];
      if (!statusValidos.includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
      }

      // Atualizar status do apartamento
      const sucesso = await db.updateApartamentoStatus(numero, status);

      if (sucesso) {
        res.status(200).json({
          success: true,
          message: `Status atualizado para ${status}`,
          numero,
          status
        });
      } else {
        res.status(404).json({
          error: 'Apartamento não encontrado'
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} não permitido`);
  }
}
